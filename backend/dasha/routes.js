const express = require("express");
const { calculateCurrentDasha } = require("./dashaCalculator");

const router = express.Router();

router.get("/test-dasha", (req, res) => {
  try {
    const { dob, tob } = req.query;

    if (!dob || !tob) {
      return res.status(400).json({
        success: false,
        error: "dob and tob required"
      });
    }

    const result = calculateCurrentDasha(dob, tob);

    res.json({
      success: true,
      place: "Delhi",
      ...result
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: "Dasha calculation failed"
    });
  }
});

module.exports = router;
