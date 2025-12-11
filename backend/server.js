// backend/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { Pool } from "pg";
import { getDasha } from "./src/astrologyService.js"; // ensure this file exists

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Health
app.get("/", (req, res) => {
  res.send("Astro Backend Working ✅");
});

// Simple DB check
app.get("/db-check", async (req, res) => {
  try {
    const r = await pool.query("SELECT NOW() as now");
    res.json({ success: true, now: r.rows[0].now });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Save submission
app.post("/submit", async (req, res) => {
  const { name, dob, tob, place, problem, mobile, language } = req.body;
  if (!name || !dob || !tob) {
    return res.status(400).json({ success: false, error: "Missing name/dob/tob" });
  }
  try {
    const result = await pool.query(
      `INSERT INTO users (name, dob, tob, place, problem, mobile, language)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, created_at`,
      [name, dob, tob, place || null, problem || null, mobile || null, language || null]
    );
    res.json({ success: true, inserted: result.rows[0] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Astrology endpoint (just forwards to your service logic)
app.get("/current-dasha", async (req, res) => {
  const { dob, tob } = req.query;
  if (!dob || !tob) {
    return res.status(400).json({ success: false, error: "Provide dob & tob (dob=YYYY-MM-DD&tob=HH:MM)" });
  }
  try {
    const raw = await getDasha({ dob, tob });
    res.json({ success: true, data: raw });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
