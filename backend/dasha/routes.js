// backend/dasha/routes.js
import express from "express";
import { calculateCurrentDasha } from "./dashaCalculator.js";

const router = express.Router();

/**
 * URL:
 * /dasha/current-dasha?dob=YYYY-MM-DD&tob=HH:mm&lat=..&lon=..&tz=Asia/Kolkata
 */
router.get("/current-dasha", async (req, res) => {
  const { dob, tob, lat, lon, tz } = req.query;

  if (!dob || !tob || !lat || !lon) {
    return res.status(400).json({
      success: false,
      error: "dob, tob, lat and lon are required"
    });
  }

  try {
    const result = await calculateCurrentDasha(
      dob,
      tob,
      parseFloat(lat),
      parseFloat(lon),
      tz || "Asia/Kolkata"
    );

    res.json(result);
  } catch (e) {
    console.error("Dasha error:", e);
    res.status(500).json({
      success: false,
      error: e.message
    });
  }
});

export default router;
