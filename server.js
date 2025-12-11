// server.js (final improved)
// Requires package.json "type":"module"
// Env required: DATABASE_URL, ASTRO_API_KEY (optional), ADMIN_SQL_KEY (optional)
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
  console.warn("Warning: ASTRO_API_KEY not set — /current-dasha will fail without it.");
}
if (!ADMIN_SQL_KEY) {
  console.warn("Warning: ADMIN_SQL_KEY not set — /run-sql endpoint will be disabled.");
}

// Pool config - Render/Postgres typically needs ssl.rejectUnauthorized=false
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: (NODE_ENV === "production") ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

async function ensureSchema() {
  // create users table if not exists
  const create = `
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
    await client.query(create);
    console.log("DB: users table is ready");
  } finally {
    client.release();
  }
}

(async () => {
  try {
    await ensureSchema();
  } catch (err) {
    console.error("Schema init error:", err);
    // don't crash — still allow server to start, but DB may fail later
  }
})();

const app = express();

// security + basic limits
app.use(helmet());
app.use(cors()); // restrict origin in production if needed
app.use(express.json());
app.set("trust proxy", 1);

const limiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 30 // requests per window per IP
});
app.use(limiter);

/** root */
app.get("/", (req, res) => {
  res.send("Astro Playlist backend is running ⚡");
});

/**
 * /current-dasha
 * Query: dob=YYYY-MM-DD&tob=HH:MM
 */
app.get("/current-dasha", async (req, res) => {
  try {
    const { dob, tob } = req.query;
    if (!dob || !tob) {
      return res.status(400).json({
        success: false,
        error: "Missing dob or tob parameter (use format dob=yyyy-mm-dd&tob=hh:mm)"
      });
    }

    // call astrology service
    const raw = await getDasha({ dob, tob });

    const now = new Date();

    // unwrap potential nested responses
    let parsed = raw;
    if (typeof raw === "object" && raw.output && typeof raw.output === "string") {
      try { parsed = JSON.parse(raw.output); } catch (e) { /* ignore */ }
    }
    if (typeof parsed === "string") {
      try { parsed = JSON.parse(parsed); } catch (e) { /* ignore */ }
    }

    let mahaResult = null;
    let antarResult = null;

    try {
      const mahaNames = Object.keys(parsed || {});
      for (const m of mahaNames) {
        const mahaObj = parsed[m];
        let mahaStart = null;
        let mahaEnd = null;

        if (mahaObj && typeof mahaObj === "object" && mahaObj[m] && mahaObj[m].start_time) {
          mahaStart = new Date(mahaObj[m].start_time);
          mahaEnd = new Date(mahaObj[m].end_time);
        } else if (mahaObj && mahaObj.start_time) {
          mahaStart = new Date(mahaObj.start_time);
          mahaEnd = new Date(mahaObj.end_time);
        }

        if (mahaStart && mahaEnd && now >= mahaStart && now < mahaEnd) {
          mahaResult = { name: m, start_time: mahaStart.toISOString(), end_time: mahaEnd.toISOString() };

          const subNames = Object.keys(mahaObj || {});
          for (const s of subNames) {
            if (!mahaObj[s] || !mahaObj[s].start_time) continue;
            const sStart = new Date(mahaObj[s].start_time);
            const sEnd = new Date(mahaObj[s].end_time);
            if (now >= sStart && now < sEnd) {
              antarResult = { name: s, start_time: sStart.toISOString(), end_time: sEnd.toISOString() };
              break;
            }
          }

          if (!antarResult) {
            for (const s of subNames) {
              if (mahaObj[s] && mahaObj[s].start_time) {
                const sStart = new Date(mahaObj[s].start_time);
                const sEnd = new Date(mahaObj[s].end_time);
                antarResult = { name: s, start_time: sStart.toISOString(), end_time: sEnd.toISOString() };
                break;
              }
            }
          }
          break;
        }
      }
    } catch (e) {
      console.warn("Parsing error in /current-dasha:", e);
    }

    if (!mahaResult) {
      return res.json({ success: true, message: "Could not auto-detect current mahadasha from API response. Returning raw.", raw: parsed });
    }

    return res.json({
      success: true,
      dob,
      tob,
      mahandantar: {
        mahadasha: mahaResult,
        antardasha: antarResult
      },
      raw: parsed
    });

  } catch (error) {
    console.error("current-dasha error:", error);
    return res.status(500).json({ success: false, error: error.message || "Server error" });
  }
});

/**
 * Simple SQL admin UI
 * only enabled when ADMIN_SQL_KEY is set
 */
app.get("/sql", (req, res) => {
  if (!ADMIN_SQL_KEY) {
    return res.status(403).send("SQL admin disabled (ADMIN_SQL_KEY not configured).");
  }
  res.send(`
    <h2>Astro SQL Admin Panel</h2>
    <p>Use this panel carefully. It runs SQL on your Render database.</p>
    <form onsubmit="runSQL(event)">
      <textarea id="query" name="query" rows="12" cols="90" placeholder="Write SQL here..."></textarea><br/>
      <input id="key" placeholder="Admin key" style="width:400px"/><br/><br/>
      <button type="submit">Run SQL</button>
    </form>
    <pre id="output" style="background:#f5f5f5;padding:10px;margin-top:12px;"></pre>
    <script>
      async function runSQL(e){
        e.preventDefault();
        const query = document.getElementById('query').value;
        const key = document.getElementById('key').value;
        const res = await fetch('/run-sql', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ query, key })
        });
        const data = await res.json();
        document.getElementById('output').innerText = JSON.stringify(data, null, 2);
      }
    </script>
  `);
});

/**
 * Run arbitrary SQL (POST /run-sql)
 * Body: { query: "SQL HERE", key: "ADMIN_SQL_KEY" }
 * Protected by ADMIN_SQL_KEY env
 */
app.post("/run-sql", async (req, res) => {
  if (!ADMIN_SQL_KEY) return res.status(403).json({ success: false, error: "Not enabled" });
  const { query, key } = req.body;
  if (!query) return res.status(400).json({ success: false, error: "SQL query missing" });
  if (!key || key !== ADMIN_SQL_KEY) return res.status(401).json({ success: false, error: "Invalid admin key" });

  let client;
  try {
    client = await pool.connect();
    const result = await client.query(query);
    return res.json({ success: true, rowCount: result.rowCount, rows: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (client) client.release();
  }
});

/**
 * Save submission
 * POST /submit
 * body: { name, dob, tob, place, problem, mobile, language }
 */
app.post("/submit", async (req, res) => {
  try {
    const { name, dob, tob, place, problem, mobile, language } = req.body;
    if (!name || !dob || !tob) {
      return res.status(400).json({ success: false, error: "Missing required fields: name,dob,tob" });
    }

    const insertSQL = `
      INSERT INTO users (name, dob, tob, place, problem, mobile, language)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id, created_at;
    `;

    const client = await pool.connect();
    try {
      const result = await client.query(insertSQL, [name, dob, tob, place || null, problem || null, mobile || null, language || null]);
      const inserted = result.rows[0] || null;
      return res.json({ success: true, inserted });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("submit error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Quick endpoint to ensure DATABASE is reachable
 */
app.get("/db-check", async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const q = await client.query("SELECT NOW() as now");
    return res.json({ success: true, now: q.rows[0].now });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (client) client && client.release();
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
