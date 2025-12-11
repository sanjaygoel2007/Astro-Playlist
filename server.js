// server.js (final improved)
// Requires package.json "type":"module"
// Env required: DATABASE_URL, ASTRO_API_KEY, ADMIN_SQL_KEY
// Optional: PORT, NODE_ENV

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pkg from "pg";
const { Pool } = pkg;
import { getDasha } from "./src/astrologyService.js";

dotenv.config();

const {
  DATABASE_URL,
  ASTRO_API_KEY,
  ADMIN_SQL_KEY,
  NODE_ENV = "production"
} = process.env;

if (!DATABASE_URL) {
  console.error("FATAL: DATABASE_URL env missing");
  process.exit(1);
}
if (!ASTRO_API_KEY) {
  console.warn("Warning: ASTRO_API_KEY not set — /current-dasha may fail.");
}
if (!ADMIN_SQL_KEY) {
  console.warn("Warning: ADMIN_SQL_KEY not set — /run-sql will be disabled.");
}

// PostgreSQL Pool
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 10
});

// Create table if not exists
async function ensureSchema() {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      dob DATE NOT NULL,
      tob TEXT NOT NULL,
      place TEXT,
      problem TEXT,
      mobile TEXT,
      language TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log("DB: users table ready.");
  } finally {
    client.release();
  }
}

ensureSchema().catch(err => console.error("Schema init error:", err));

const app = express();

// Security
app.use(helmet());
app.use(cors());
app.use(express.json());
app.set("trust proxy", 1);

// Rate limit
app.use(rateLimit({
  windowMs: 30 * 1000,
  max: 30
}));

// Root
app.get("/", (req, res) => {
  res.send("Astro Playlist backend is running ⚡");
});


// --------------------------------------------------------------------
// CURRENT DASHA
// --------------------------------------------------------------------
app.get("/current-dasha", async (req, res) => {
  try {
    const { dob, tob } = req.query;

    if (!dob || !tob) {
      return res.status(400).json({
        success: false,
        error: "Missing dob or tob. Format: dob=YYYY-MM-DD&tob=HH:MM"
      });
    }

    const raw = await getDasha({ dob, tob });
    let parsed = raw;

    if (raw?.output) {
      try { parsed = JSON.parse(raw.output); } catch {}
    }
    if (typeof parsed === "string") {
      try { parsed = JSON.parse(parsed); } catch {}
    }

    const now = new Date();
    let mahaResult = null;
    let antarResult = null;

    try {
      const mahaList = Object.keys(parsed || {});

      for (const m of mahaList) {
        const mahaObj = parsed[m];
        if (!mahaObj) continue;

        let mStart = mahaObj[m]?.start_time ? new Date(mahaObj[m].start_time) :
                   mahaObj?.start_time ? new Date(mahaObj.start_time) : null;

        let mEnd = mahaObj[m]?.end_time ? new Date(mahaObj[m].end_time) :
                 mahaObj?.end_time ? new Date(mahaObj.end_time) : null;

        if (!mStart || !mEnd) continue;

        if (now >= mStart && now < mEnd) {
          // Found current MAHADASHA
          mahaResult = {
            name: m,
            start_time: mStart.toISOString(),
            end_time: mEnd.toISOString()
          };

          // Find ANTARDASHA
          const subNames = Object.keys(mahaObj);
          for (const s of subNames) {
            const sObj = mahaObj[s];
            if (!sObj?.start_time) continue;

            const sStart = new Date(sObj.start_time);
            const sEnd = new Date(sObj.end_time);

            if (now >= sStart && now < sEnd) {
              antarResult = {
                name: s,
                start_time: sStart.toISOString(),
                end_time: sEnd.toISOString()
              };
              break;
            }
          }

          // fallback if none matched
          if (!antarResult) {
            for (const s of subNames) {
              const sObj = mahaObj[s];
              if (!sObj?.start_time) continue;

              const sStart = new Date(sObj.start_time);
              const sEnd = new Date(sObj.end_time);
              antarResult = {
                name: s,
                start_time: sStart.toISOString(),
                end_time: sEnd.toISOString()
              };
              break;
            }
          }

          break;
        }
      }
    } catch (e) {
      console.warn("Dasha parse error:", e);
    }

    if (!mahaResult) {
      return res.json({ success: true, message: "Could not detect current dasha.", raw: parsed });
    }

    return res.json({
      success: true,
      dob,
      tob,
      mahandantar: { mahadasha: mahaResult, antardasha: antarResult },
      raw: parsed
    });

  } catch (err) {
    console.error("current-dasha error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});


// --------------------------------------------------------------------
// SQL WEB PANEL
// --------------------------------------------------------------------
app.get("/sql", (req, res) => {
  if (!ADMIN_SQL_KEY) {
    return res.status(403).send("SQL panel disabled. Set ADMIN_SQL_KEY env.");
  }

  res.send(`
    <h2>Astro SQL Admin Panel</h2>
    <form onsubmit="runSQL(event)">
      <textarea id="query" rows="10" cols="90"></textarea><br><br>
      <input id="key" placeholder="Admin key" style="width:300px;"><br><br>
      <button type="submit">Run SQL</button>
    </form>
    <pre id="output" style="background:#eee;padding:15px;margin-top:10px;"></pre>
    <script>
      async function runSQL(e){
        e.preventDefault();
        const query = document.getElementById("query").value;
        const key = document.getElementById("key").value;

        const res = await fetch("/run-sql", {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ query, key })
        });

        const out = await res.json();
        document.getElementById("output").innerText =
          JSON.stringify(out, null, 2);
      }
    </script>
  `);
});


// --------------------------------------------------------------------
// RUN SQL
// --------------------------------------------------------------------
app.post("/run-sql", async (req, res) => {
  if (!ADMIN_SQL_KEY) {
    return res.status(403).json({ success: false, error: "SQL disabled." });
  }

  const { query, key } = req.body;

  if (key !== ADMIN_SQL_KEY) {
    return res.status(401).json({ success: false, error: "Invalid admin key" });
  }

  if (!query) {
    return res.status(400).json({ success: false, error: "Missing SQL query" });
  }

  let client;
  try {
    client = await pool.connect();
    const result = await client.query(query);
    return res.json({ success: true, rowCount: result.rowCount, rows: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    client?.release();
  }
});


// --------------------------------------------------------------------
// SUBMIT USER FORM DATA
// --------------------------------------------------------------------
app.post("/submit", async (req, res) => {
  try {
    const { name, dob, tob, place, problem, mobile, language } = req.body;

    if (!name || !dob || !tob) {
      return res.status(400).json({ success: false, error: "Missing name, dob or tob" });
    }

    const sql = `
      INSERT INTO users (name, dob, tob, place, problem, mobile, language)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *;
    `;

    const client = await pool.connect();
    const result = await client.query(sql, [
      name,
      dob,
      tob,
      place || null,
      problem || null,
      mobile || null,
      language || null
    ]);
    client.release();

    return res.json({ success: true, data: result.rows[0] });

  } catch (err) {
    console.error("submit error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});


// --------------------------------------------------------------------
// DB CHECK
// --------------------------------------------------------------------
app.get("/db-check", async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW() as now");
    client.release();

    return res.json({ success: true, now: result.rows[0].now });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});


// --------------------------------------------------------------------
// START SERVER
// --------------------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
