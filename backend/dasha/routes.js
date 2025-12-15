import express from "express";
import { calculateCurrentDasha } from "./vimshottari.js";

const router = express.Router();

/**
 * URL:
 * /dasha/current-dasha?dob=YYYY-MM-DD
 *
 * NOTE:
 * Moon longitude abhi hardcoded / manual hai.
 * Team AstroSage se verify karke DB me correct kar sakti hai.
 */

router.get("/current-dasha", (req, res) => {
  const { dob } = req.query;

  if (!dob) {
    return res.status(400).json({
      success: false,
      error: "dob (YYYY-MM-DD) required"
    });
  }

  try {
    // 🔹 TEMP / MVP:
    // AstroSage se manual reference
    const moonLongitude = 298.6; // example, baad me DB se aayega

    const result = calculateCurrentDasha(dob, moonLongitude);

    return res.json({
      success: true,
      ...result
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      error: e.message
    });
  }
});

export default router;
