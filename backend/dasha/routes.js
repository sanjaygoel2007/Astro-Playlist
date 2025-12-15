import express from "express";
import { calculateCurrentDasha } from "./vimshottari.js";

const router = express.Router();

router.get("/current-dasha", (req, res) => {
  const { dob } = req.query;

  if (!dob) {
    return res.status(400).json({
      success: false,
      error: "dob (YYYY-MM-DD) required"
    });
  }

  const result = calculateCurrentDasha(dob);

  return res.json({
    success: true,
    ...result,
    note: "Auto-generated result. May change after AstroSage verification."
  });
});

export default router;
