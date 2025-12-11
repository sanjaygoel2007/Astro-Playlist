import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pkg from "pg";
const { Pool } = pkg;
import { getDasha } from "./src/astrologyService.js";

dotenv.config();

const { DATABASE_URL, ASTRO_API_KEY, ADMIN_SQL_KEY, NODE_ENV = "production" } = process.env;

// DB Connection
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

// Create table if not exists
async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT,
      dob TEXT,
      tob TEXT,
      place TEXT,
      problem TEXT,
      mobile TEXT,
      language TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}
ensureSchema();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.set("trust proxy", 1);

app.use(rateLimit({ windowMs: 30000, max: 30 }));

app.get("/", (req, res) => {
  res.send("Astro Playlist backend running successfully 🚀");
});

// Save form data
app.post("/submit", async (req, res) => {
  try {
    const { name, dob, tob, place, problem, mobile, language } = req.body;

    const q = `
      INSERT INTO users (name, dob, tob, place, problem, mobile, language)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id
    `;
    const r = await pool.query(q, [name, dob, tob, place, problem, mobile, language]);

    res.json({ success: true, id: r.rows[0].id });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Admin SQL Panel
app.get("/sql", (req, res) => {
  if (!ADMIN_SQL_KEY) return res.send("SQL panel disabled.");
  res.send(`
    <h2>SQL Admin</h2>
    <form onsubmit="runSQL(event)">
      <textarea id="q" rows="10" cols="60"></textarea><br>
      <input id="key" placeholder="Admin key"/><br><br>
      <button>Run</button>
    </form>
    <pre id="out"></pre>
    <script>
      async function runSQL(e){
        e.preventDefault();
        let r = await fetch('/run-sql',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:q.value,key:key.value})});
        out.innerText = JSON.stringify(await r.json(),null,2);
      }
    </script>
  `);
});

// Execute SQL
app.post("/run-sql", async (req, res) => {
  try {
    const { query, key } = req.body;
    if (key !== ADMIN_SQL_KEY) return res.json({ success: false, error: "Invalid key" });

    const r = await pool.query(query);
    res.json({ success: true, rows: r.rows, rowCount: r.rowCount });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on PORT " + PORT));
