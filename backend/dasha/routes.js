// backend/dasha/routes.js
import express from "express";
import axios from "axios";

const router = express.Router();

/**
 * FINAL Dasha endpoint
 * NO Swiss Ephemeris
 * API based only
 */
router.get("/current-dasha", async (req, res) => {
  try {
    const { dob, tob, lat, lon } = req.query;

    if (!dob || !tob || !lat || !lon) {
      return res.status(400).json({
        error: "dob, tob, lat, lon required"
      });
    }

    // 🔁 TEMP: mock response until API call is wired
    // (we will replace this with AstrologyAPI / Prokerala call)
    return res.json({
      source: "api",
      mahadasha: "Saturn",
      antardasha: "Venus",
      antardasha_end_date: "2026-12-05"
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
