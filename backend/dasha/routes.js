// backend/dasha/routes.js
import express from "express";

const router = express.Router();

/**
 * TEMP MOCK ROUTE
 * Swiss Ephemeris = COMPLETELY REMOVED
 */
router.get("/current-dasha", (req, res) => {
  const { dob, tob, lat, lon } = req.query;

  if (!dob || !tob || !lat || !lon) {
    return res.status(400).json({
      success: false,
      error: "dob, tob, lat, lon required"
    });
  }

  // ✅ Mock response (API will replace this later)
  return res.json({
    success: true,
    source: "api",
    mahadasha: "Saturn",
    antardasha: "Venus",
    antardasha_end_date: "2026-12-05"
  });
});

export default router;
