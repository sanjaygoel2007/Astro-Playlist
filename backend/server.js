// server.js - minimal ready-to-deploy server
// requires: package.json "type":"module"
// env: DATABASE_URL, ASTRO_API_KEY (opt), ADMIN_SQL_KEY (opt), PORT (opt)

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pkg from "pg";
const { Pool } = pkg;
import { getDasha } from "./src/astrologyService.js"; // ensure this path exists

dotenv.config();

const { DATABASE_URL, NODE_ENV = "production", ADMIN_SQL_KEY } = process.env;

if (!DATABASE_URL) {
  console.error("FATAL: DATABASE_URL environment variable is required.");
  // continue so Render build logs show error, but prefer to exit to avoid runtime crash
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
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
    );`;
  const client = await pool.connect();
  try {
    await client.query(create);
    console.log("DB: users table ready");
  } finally {
    client.release();
  }
}

ensureSchema().catch(err => {
  console.warn("Schema init failed:", err && err.message);
});

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.set("trust proxy", 1);

const limiter = rateLimit({
  windowMs: 30 * 1000,
  max: 30
});
app.use(limiter);

app.get("/", (req, res) => res.send("Astro Playlist backend is running ⚡"));

app.get("/current-dasha", async (req, res) => {
  try {
    const { dob, tob } = req.query;
    if (!dob || !tob) return res.status(400).json({ success: false, error: "Missing dob or tob query" });

    const raw = await getDasha({ dob, tob });

    let parsed = raw;
    if (typeof raw === "object" && raw.output && typeof raw.output === "string") {
      try { parsed = JSON.parse(raw.output); } catch(e){}
    }
    if (typeof parsed === "string") {
      try { parsed = JSON.parse(parsed); } catch(e){}
    }

    const now = new Date();
    let mahaResult = null, antarResult = null;

    try {
      const mahaNames = Object.keys(parsed || {});
      for (const m of mahaNames) {
        const mahaObj = parsed[m];
        let mahaStart = null, mahaEnd = null;
        if (mahaObj && mahaObj[m] && mahaObj[m].start_time) {
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
                antarResult = { name: s, start_time: new Date(mahaObj[s].start_time).toISOString(), end_time: new Date(mahaObj[s].end_time).toISOString() };
                break;
              }
            }
          }
          break;
        }
      }
    } catch (e) {
      console.warn("parse error /current-dasha:", e && e.message);
    }

    if (!mahaResult) return res.json({ success: true, message: "Could not detect current mahadasha; returning raw", raw: parsed });

    return res.json({ success: true, dob, tob, mahandantar: { mahadasha: mahaResult, antardasha: antarResult }, raw: parsed });
  } catch (err) {
    console.error("current-dasha error:", err && err.stack || err);
    return res.status(500).json({ success: false, error: err && err.message || "Server error" });
  }
});

app.get("/sql", (req, res) => {
  if (!ADMIN_SQL_KEY) return res.status(403).send("SQL admin disabled.");
  res.send(`<h2>Astro SQL Admin Panel</h2>
    <form onsubmit="runSQL(event)">
      <textarea id="query" rows="12" cols="80"></textarea><br/>
      <input id="key" placeholder="Admin key" style="width:400px"/><br/>
      <button type="submit">Run SQL</button>
    </form>
    <pre id="output"></pre>
    <script>
      async function runSQL(e){
        e.preventDefault();
        const query = document.getElementById('query').value;
        const key = document.getElementById('key').value;
        const res = await fetch('/run-sql',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query,key})});
        const data = await res.json();
        document.getElementById('output').innerText = JSON.stringify(data,null,2);
      }
    </script>`);
});

app.post("/run-sql", async (req, res) => {
  if (!ADMIN_SQL_KEY) return res.status(403).json({ success: false, error: "Disabled" });
  const { query, key } = req.body;
  if (!query) return res.status(400).json({ success: false, error: "SQL missing" });
  if (!key || key !== ADMIN_SQL_KEY) return res.status(401).json({ success: false, error: "Invalid key" });
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

app.post("/submit", async (req, res) => {
  const { name, dob, tob, place, problem, mobile, language } = req.body;
  if (!name || !dob || !tob) return res.status(400).json({ success:false, error:"Missing required fields" });
  const insertSQL = `INSERT INTO users (name,dob,tob,place,problem,mobile,language) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, created_at`;
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(insertSQL, [name,dob,tob,place||null,problem||null,mobile||null,language||null]);
    return res.json({ success:true, inserted: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success:false, error: err.message });
  } finally {
    if (client) client && client.release();
  }
});

app.get("/db-check", async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const q = await client.query("SELECT NOW() as now");
    return res.json({ success:true, now: q.rows[0].now });
  } catch (err) {
    return res.status(500).json({ success:false, error: err.message });
  } finally {
    if (client) client && client.release();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
