// backend/dasha/routes.js
import express from "express";
import { calculateCurrentDasha } from "./dashaCalculator.js";

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
    return res.json(result);
  } catch (e) {
    console.error("Dasha route error:", e);
    return res.status(500).json({ error: "Dasha error" });
  }
});

export default router;
