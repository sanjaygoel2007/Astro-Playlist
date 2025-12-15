import express from "express";
import { calculateVimshottari } from "./vimshottari.js";

const router = express.Router();

/*
URL:
 /dasha/current-dasha?dob=1965-02-18
*/

router.get("/current-dasha", (req, res) => {
  const { dob } = req.query;

  if (!dob) {
    return res.status(400).json({
      success: false,
      error: "dob required (YYYY-MM-DD)"
    });
  }

  try {
    const result = calculateVimshottari(dob);
    return res.json({ success: true, ...result });
  } catch (e) {
    return res.status(500).json({
      success: false,
      error: e.message
    });
  }
});

export default router;
