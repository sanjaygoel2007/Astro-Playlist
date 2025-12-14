import express from "express";
import { calculateCurrentDasha } from "./dashaCalculator.js";

const router = express.Router();

router.get("/test-dasha", (req, res) => {
  try {
    const { dob, tob } = req.query;

    if (!dob || !tob) {
      return res.status(400).json({
        success: false,
        error: "dob and tob are required (YYYY-MM-DD, HH:mm)"
      });
    }

    const result = calculateCurrentDasha(dob, tob);

    return res.json({
      success: true,
      place: "Delhi",
      ...result
    });

  } catch (err) {
    console.error("Dasha route error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to calculate dasha"
    });
  }
});

export default router;
