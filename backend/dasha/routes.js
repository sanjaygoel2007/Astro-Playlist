const express = require("express");
const { calculateCurrentDasha } = require("./dashaCalculator");

const router = express.Router();

router.get("/test-dasha", (req, res) => {
  try {
    const { dob, tob } = req.query;

    if (!dob || !tob) {
      return res.status(400).json({
        error: "dob and tob are required"
      });
    }

    const result = calculateCurrentDasha(dob, tob);
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Dasha error" });
  }
});

module.exports = router;
