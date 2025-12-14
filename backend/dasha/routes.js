const express = require("express");
const { calculateCurrentDasha } = require("./dashaCalculator");

const router = express.Router();

/**
 * URL:
 * /dasha/test-dasha?dob=YYYY-MM-DD&tob=HH:mm
 */
router.get("/test-dasha", (req, res) => {
  try {
    const { dob, tob } = req.query;

    if (!dob || !tob) {
      return res.status(400).json({
        error: "dob and tob are required (YYYY-MM-DD, HH:mm)"
      });
    }

    const result = calculateCurrentDasha(dob, tob);
    res.json(result);
  } catch (error) {
    console.error("Dasha error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
