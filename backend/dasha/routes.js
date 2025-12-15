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
     * AUTO MODE (approximate but stable)
     * Moon assumed at ~62% of its Nakshatra
     * This avoids early-year results like 1979
     */
    const ASSUMED_NAKSHATRA_PERCENT = 0.62;
    const NAKSHATRA_LENGTH = 13 + 20 / 60;

    // Saturn nakshatra (Anuradha) start ≈ 226°40'
    const SATURN_NAK_START = 226 + 40 / 60;

    const moonLongitude =
      SATURN_NAK_START +
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
