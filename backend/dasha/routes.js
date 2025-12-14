import express from "express";
import { calculateCurrentDasha } from "./dashaCalculator.js";

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

    return res.json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error("Dasha route error:", err);
    return res.status(500).json({
      success: false,
      error: "Dasha calculation failed"
    });
  }
});

export default router;
