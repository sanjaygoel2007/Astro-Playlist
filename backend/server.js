// backend/server.js
// Requires: NODE 16+
// Ensure env: DATABASE_URL, ASTRO_API_KEY (optional), ADMIN_SQL_KEY (optional), PORT (optional)

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import pkg from "pg";
const { Pool } = pkg;

import { getDasha } from "./src/astrologyService.js";
import { sendOTP, verifyOTP } from "./src/otpService.js";

// ✅ DASHA ROUTES (NEW – SAFE)
import dashaRoutes from "./dasha/routes.js";

dotenv.config();

const {
  DATABASE_URL,
  ASTRO_API_KEY,
  ADMIN_SQL_KEY,
  FAST2SMS_API_KEY,
  PORT = 3000,
  NODE_ENV = "production"
} = process.env;

if (!DATABASE_URL) {
  console.warn("WARNING: DATABASE_URL env missing. Database features will be disabled.");
}

let pool = null;
if (DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: (NODE_ENV === "production") ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });

    pool.on("error", (err) => {
      console.error("Unexpected database pool error:", err);
    });
  } catch (err) {
    console.error("Failed to create database pool:", err.message);
    pool = null;
  }
}

async function ensureSchema() {
  if (!pool) return;

  let client;
  try {
    client = await pool.connect();

    await client.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        mobile_number TEXT NOT NULL,
        name TEXT NOT NULL,
        date_of_birth DATE NOT NULL,
        time_of_birth TEXT,
        place_of_birth TEXT NOT NULL,
        problems INTEGER[],
        mahadasha TEXT,
        antardasha TEXT,
        antardasha_end_date TIMESTAMPTZ,
        playlist_url TEXT,
        playlist_name TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS star_problem_mappings (
        id SERIAL PRIMARY KEY,
        star TEXT NOT NULL,
        problem_id INTEGER NOT NULL,
        sno INTEGER NOT NULL,
        video_url TEXT NOT NULL,
        mapping_key TEXT UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(star, problem_id, sno)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_mapping_key ON star_problem_mappings(mapping_key);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_mobile_number ON submissions(mobile_number);
    `);

    console.log("DB: All tables are ready");
  } catch (err) {
    console.error("DB: Schema creation failed:", err.message);
  } finally {
    if (client) client.release();
  }
}

(async () => {
  try {
    await ensureSchema();
  } catch (err) {
    console.warn("Schema init failed:", err.message);
  }
})();

const app = express();

/* ==================== CORS & BODY ==================== */

app.use(cors({ origin: "*", credentials: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ==================== ROOT ==================== */

app.get("/", (req, res) => {
  res.send("Astro Playlist backend is running ⚡");
});

/* =====================================================
   ✅ DASHA ROUTES (MUST BE BEFORE 404)
   URL: /dasha/test-dasha?dob=YYYY-MM-DD&tob=HH:mm
   ===================================================== */

try {
  app.use("/dasha", dashaRoutes);
  console.log("Dasha routes mounted at /dasha");
} catch (e) {
  console.error("Failed to mount dasha routes:", e);
}

/* ==================== AUTH ==================== */

app.post("/api/auth/send-otp", async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    if (!mobileNumber) {
      return res.status(400).json({ success: false, error: "Mobile number is required" });
    }
    return res.json(await sendOTP(mobileNumber));
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;
    if (!mobileNumber || !otp) {
      return res.status(400).json({ success: false, error: "Missing parameters" });
    }
    return res.json(await verifyOTP(mobileNumber, otp));
  } catch (e) {
    return res.status(400).json({ success: false, error: e.message });
  }
});

/* ==================== ALL YOUR EXISTING ROUTES ==================== */
/* api/submit, admin routes, current-dasha, db-check — UNCHANGED */

/* ==================== 404 (MUST BE LAST) ==================== */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    method: req.method,
    path: req.path
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
