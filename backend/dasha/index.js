const express = require("express");
const { calculateCurrentDasha } = require("./dashaCalculator");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/test-dasha", (req, res) => {
  try {
    const { dob, tob } = req.query;

    if (!dob || !tob) {
      return res.status(400).json({
        error: "dob and tob are required (YYYY-MM-DD, HH:mm)"
      });
    }

    const result = calculateCurrentDasha(dob, tob);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/", (req, res) => {
  res.send("Dasha API is running");
});

app.listen(PORT, () => {
  console.log(`Dasha API running on port ${PORT}`);
});
