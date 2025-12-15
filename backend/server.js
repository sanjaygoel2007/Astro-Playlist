// backend/server.js
// Requires: NODE 16+

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import pkg from "pg";
import prokeralaTokenTest from "./test/prokeralaToken.js";
import dashaRoutes from "./dasha/routes.js";
import { sendOTP, verifyOTP } from "./src/otpService.js";

const { Pool } = pkg;

dotenv.config();

const {
  DATABASE_URL,
  PORT = 3000,
  NODE_ENV = "production"
} = process.env;

/* ==================== DATABASE ==================== */

let pool = null;

if (DATABASE_URL) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: NODE_ENV === "production" ? { rejectUnauthorized: false } : false
  });

  pool.on("error", (err) => {
    console.error("DB pool error:", err);
  });
}

/* ==================== APP INIT ==================== */

const app = express();

app.use(cors({ origin: "*", credentials: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ==================== ROOT ==================== */

app.get("/", (req, res) => {
  res.send("Astro Playlist backend is running ⚡");
});

/* ==================== DASHA ROUTES ==================== */

app.use("/dasha", dashaRoutes);
console.log("✅ Dasha routes mounted at /dasha");

/* ==================== PROKERALA TOKEN TEST ==================== */

app.use("/test", prokeralaTokenTest);
console.log("✅ Prokerala test routes mounted at /test");

/* ==================== AUTH ROUTES ==================== */

app.post("/api/auth/send-otp", async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    if (!mobileNumber) {
      return res.status(400).json({ success: false, error: "Mobile number required" });
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

/* ==================== 404 (MUST BE LAST) ==================== */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    method: req.method,
    path: req.path
  });
});

/* ==================== START SERVER ==================== */

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
