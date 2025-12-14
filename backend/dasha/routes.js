import express from "express";
import { calculateCurrentDasha } from "./dashaCalculator.js";

const router = express.Router();

router.get("/test-dasha", (req, res) => {
  try {
    const { dob, tob } = req.query;

    if (!dob || !tob) {
      return res.status(400).json({
        success: false,
        error: "dob and tob are required"
      });
    }

    const result = calculateCurrentDasha(dob, tob);

    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error("Dasha error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to calculate dasha"
    });
  }
});

export default router;
