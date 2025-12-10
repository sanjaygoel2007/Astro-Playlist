// server.js
import express from "express";
import dotenv from "dotenv";
import { getDasha } from "./src/astrologyService.js";

dotenv.config();

const app = express();
app.use(express.json());

// Root check
app.get("/", (req, res) => {
  res.send("Astro Playlist backend is running ⚡");
});

// RAW DEBUG ROUTE – sirf FreeAstrologyAPI ka pura JSON dikhaega
app.get("/current-dasha-raw", async (req, res) => {
  try {
    const { dob, tob } = req.query;

    if (!dob || !tob) {
      return res.status(400).json({
        success: false,
        error: "Missing dob or tob (use dob=YYYY-MM-DD&tob=HH:MM)",
      });
    }

    const raw = await getDasha({ dob, tob });
    return res.json(raw); // bina parsing ke pura data
  } catch (error) {
    console.error("Error in /current-dasha-raw:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
});

// SIMPLE ROUTE – abhi ke liye sirf raw data wrap karke dega
app.get("/current-dasha", async (req, res) => {
  try {
    const { dob, tob } = req.query;

    if (!dob || !tob) {
      return res.status(400).json({
        success: false,
        error: "Missing dob or tob (use dob=YYYY-MM-DD&tob=HH:MM)",
      });
    }

    const raw = await getDasha({ dob, tob });

    // Abhi koi complicated parsing nahi, sirf raw return
    return res.json({
      success: true,
      dob,
      tob,
      raw,
    });
  } catch (error) {
    console.error("Error in /current-dasha:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
