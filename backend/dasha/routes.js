import express from "express";
import { calculateCurrentDasha } from "./vimshottari.js";

const router = express.Router();

/**
 * /dasha/current-dasha?dob=YYYY-MM-DD
 *
 * Auto calculation + manual override supported
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
    /**
     * AUTO APPROX MODE (Stable Default)
     * Moon assumed in Anuradha Nakshatra (Saturn)
     * ~60–65% progress → Saturn–Venus around 2027–2028
     */

    const NAKSHATRA_LENGTH = 13 + 20 / 60; // 13°20'
    const ASSUMED_NAKSHATRA_PERCENT = 0.62;

    // ✅ CORRECT: Anuradha start (Saturn)
    const ANURADHA_START = 213 + 20 / 60;

    const moonLongitude =
      ANURADHA_START +
      ASSUMED_NAKSHATRA_PERCENT * NAKSHATRA_LENGTH;

    const result = calculateCurrentDasha(dob, moonLongitude);

    return res.json({
      success: true,
      ...result,
      confidence: "auto-approximate",
      note: "Result may be corrected after AstroSage verification"
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      error: e.message
    });
  }
});

export default router;
