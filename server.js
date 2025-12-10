// server.js
import express from "express";
import dotenv from "dotenv";
import { getDasha } from "./src/astrologyService.js";

dotenv.config();
const app = express();
app.use(express.json());

// Root route
app.get("/", (req, res) => {
  res.send("Astro Playlist backend is running ⚡");
});

// Utility: check if date is within range
function isBetween(date, start, end) {
  const d = new Date(date);
  return d >= new Date(start) && d <= new Date(end);
}

// Main route
app.get("/current-dasha", async (req, res) => {
  try {
    const { dob, tob } = req.query;
    if (!dob || !tob) {
      return res.status(400).json({
        success: false,
        error: "Missing dob or tob (use format dob=YYYY-MM-DD&tob=HH:MM)",
      });
    }

    // Fetch all maha + antar dashas
    const raw = await getDasha({ dob, tob });
    const list = raw?.output || [];

    if (!Array.isArray(list) || !list.length) {
      throw new Error("Invalid API format or empty dasha list");
    }

    const now = new Date();
    let current = null;

    // Loop through each Mahadasha
    for (const maha of list) {
      const mahaStart = maha.start_time || maha.start_date;
      const mahaEnd = maha.end_time || maha.end_date;

      // Check if current date is inside this Mahadasha
      if (isBetween(now, mahaStart, mahaEnd)) {
        // Go inside its Antardasha list
        const antars = maha.antar_dasha || maha.antardasha || [];

        for (const antar of antars) {
          const antarStart = antar.start_time || antar.start_date;
          const antarEnd = antar.end_time || antar.end_date;

          if (isBetween(now, antarStart, antarEnd)) {
            current = {
              mahadasha: maha.lord || maha.mah_dasa_lord || maha.mah_dasha_lord,
              antardasha:
                antar.lord ||
                antar.antar_dasa_lord ||
                antar.antar_dasha_lord,
              start: antarStart,
              end: antarEnd,
            };
            break;
          }
        }

        // अगर antardasha में नहीं मिला तो सिर्फ mahadasha return कर दो
        if (!current) {
          current = {
            mahadasha: maha.lord || maha.mah_dasa_lord,
            start: mahaStart,
            end: mahaEnd,
          };
        }
        break;
      }
    }

    if (!current) {
      throw new Error("No matching dasha found for current date");
    }

    return res.json({
      success: true,
      dob,
      tob,
      ...current,
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
