// backend/dasha/routes.js
console.log("🚀 TEST-DASHA ROUTE HIT");
import express from "express";
import { calculateCurrentDasha } from "./dashaCalculator.js";

const router = express.Router();

router.get("/test-dasha", (req, res) => {
  const { dob, tob } = req.query;

  if (!dob || !tob) {
    return res.status(400).json({ error: "dob and tob required" });
  }

  try {
    const result = calculateCurrentDasha(dob, tob);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
