// backend/server.js
// Requires: NODE 16+
// Ensure env: DATABASE_URL, ASTRO_API_KEY (optional), ADMIN_SQL_KEY (optional), PORT (optional)

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import pkg from "pg";
const { Pool } = pkg;

import { getDasha } from "./src/astrologyService.js"; // adjust path if needed

dotenv.config();

const {
  DATABASE_URL,
  ASTRO_API_KEY,
  ADMIN_SQL_KEY,
  PORT = 3000,
  NODE_ENV = "production"
} = process.env;

if (!DATABASE_URL) {
  console.error("FATAL: DATABASE_URL env missing");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  // If your provider requires SSL (e.g. Render), keep rejectUnauthorized: false
  ssl: (NODE_ENV === "production") ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

async function ensureSchema() {
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
    console.warn("Schema init failed (continuing):", err.message || err);
  }
})();

const app = express();
app.use(cors());

// parse JSON bodies
app.use(express.json());
// parse html form bodies (for testing with browser form)
app.use(express.urlencoded({ extended: true }));

// Root
app.get("/", (req, res) => {
  res.send("Astro Playlist backend is running ⚡");
});

/**
 * Simple browser form for manual testing (GET /submit)
 * Use in browser: GET /submit -> fill form -> submit -> hits POST /submit
 */
app.get("/submit", (req, res) => {
  res.send(`
    <h3>Submit (test form)</h3>
    <form method="POST" action="/submit">
      <input name="name" placeholder="Name" required/><br/>
      <input name="dob" placeholder="DOB YYYY-MM-DD" required/><br/>
      <input name="tob" placeholder="Time HH:MM" required/><br/>
      <input name="place" placeholder="Place"/><br/>
      <input name="problem" placeholder="Problem"/><br/>
      <input name="mobile" placeholder="Mobile"/><br/>
      <input name="language" placeholder="Language"/><br/><br/>
      <button type="submit">Submit</button>
    </form>
  `);
});

/**
 * POST /submit
 * Body: { name, dob, tob, place, problem, mobile, language }
 */
app.post("/submit", async (req, res) => {
  const { name, dob, tob, place, problem, mobile, language } = req.body;
  if (!name || !dob || !tob) {
    return res.status(400).json({ success: false, error: "Missing required fields: name,dob,tob" });
  }

  const insertSQL = `
    INSERT INTO users (name, dob, tob, place, problem, mobile, language)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING id, created_at;
  `;

  let client;
  try {
    client = await pool.connect();
    const result = await client.query(insertSQL, [
      name,
      dob,
      tob,
      place || null,
      problem || null,
      mobile || null,
      language || null
    ]);
    return res.json({ success: true, message: "Saved", inserted: result.rows[0] });
  } catch (err) {
    console.error("submit error:", err);
    return res.status(500).json({ success: false, error: err.message || "Server error" });
  } finally {
    if (client) client.release();
  }
});

/**
 * /current-dasha
 * Query params: dob=YYYY-MM-DD&tob=HH:MM
 * Returns parsed mahadasha/antardasha if available (calls getDasha)
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

    const raw = await getDasha({ dob, tob });
    const now = new Date();

    let parsed = raw;
    if (typeof raw === "object" && raw.output && typeof raw.output === "string") {
      try { parsed = JSON.parse(raw.output); } catch(e){ /* ignore */ }
    }
    if (typeof parsed === "string") {
      try { parsed = JSON.parse(parsed); } catch(e){ /* ignore */ }
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
                antarResult = {
                  name: s,
                  start_time: new Date(mahaObj[s].start_time).toISOString(),
                  end_time: new Date(mahaObj[s].end_time).toISOString()
                };
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
      mahandantar: { mahadasha: mahaResult, antardasha: antarResult },
      raw: parsed
    });

  } catch (error) {
    console.error("current-dasha error:", error);
    return res.status(500).json({ success: false, error: error.message || "Server error" });
  }
});

/**
 * Optional simple /db-check
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
    if (client) client.release();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
