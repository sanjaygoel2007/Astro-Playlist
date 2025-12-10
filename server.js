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

// Simple route → raw dasha data return karega
app.get("/current-dasha", async (req, res) => {
  try {
    const { dob, tob } = req.query;

    if (!dob || !tob) {
      return res.status(400).json({
        success: false,
        error: "Missing dob or tob parameter (use dob=YYYY-MM-DD&tob=HH:MM)",
      });
    }

    // Astrology API se raw data
    const raw = await getDasha({ dob, tob });

    // Abhi ke liye sirf raw response bhej rahe hain
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

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
