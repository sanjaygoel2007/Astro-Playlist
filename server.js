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

/**
 * Helper: raw API response se current mahadasha / antardasha nikalna
 * NOTE: FreeAstrologyAPI ka exact structure user ke account par depend karta hai.
 * Yahaan hum common pattern ko handle kar rahe hain:
 *   data.output[0].updict  → mahadasha list
 *   har mahadasha.subdict  → antar dasha list
 */
function extractCurrentDasha(raw) {
  // different accounts me key ka naam thoda alag ho sakta hai, isliye safe access
  const container = raw?.output?.[0];
  const mahaList =
    container?.updict ||
    container?.mahadasha ||
    container?.mahadashas ||
    [];

  if (!Array.isArray(mahaList) || mahaList.length === 0) {
    throw new Error("Unexpected API format: mahadasha list not found");
  }

  const now = new Date();

  let currentMahadasha = null;
  let currentAntar = null;

  // Try to find antar dasha jiska date-range ke andar 'aaj' aa raha ho
  for (const maha of mahaList) {
    const antarList =
      maha.subdict ||
      maha.antar_dasha ||
      maha.antardashas ||
      [];

    if (!Array.isArray(antarList) || antarList.length === 0) {
      continue;
    }

    for (const antar of antarList) {
      const startStr =
        antar.start_date ||
        antar.start_time ||
        antar.start ||
        antar["start date"] ||
        antar["start_time"];

      const endStr =
        antar.end_date ||
        antar.end_time ||
        antar.end ||
        antar["end date"] ||
        antar["end_time"];

      if (!startStr || !endStr) continue;

      const start = new Date(startStr);
      const end = new Date(endStr);

      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        if (now >= start && now <= end) {
          currentMahadasha = maha;
          currentAntar = antar;
          break;
        }
      }
    }

    if (currentAntar) break;
  }

  // Agar exact "current" na mile to fallback → pehla mahadasha + uska pehla antar
  if (!currentMahadasha) {
    currentMahadasha = mahaList[0];
  }
  if (!currentAntar) {
    const fallbackAntars =
      currentMahadasha.subdict ||
      currentMahadasha.antar_dasha ||
      currentMahadasha.antardashas ||
      [];
    currentAntar = Array.isArray(fallbackAntars)
      ? fallbackAntars[0]
      : null;
  }

  // Planet / lord ka naam निकालने ke liye multiple key options
  const mahaName =
    currentMahadasha?.planet ||
    currentMahadasha?.lord ||
    currentMahadasha?.mah_dasa_lord ||
    currentMahadasha?.mah_dasha_lord ||
    currentMahadasha?.name ||
    null;

  const antarName =
    currentAntar?.planet ||
    currentAntar?.lord ||
    currentAntar?.antar_dasha_lord ||
    currentAntar?.name ||
    null;

  const startStr =
    currentAntar?.start_date ||
    currentAntar?.start_time ||
    currentAntar?.start ||
    null;

  const endStr =
    currentAntar?.end_date ||
    currentAntar?.end_time ||
    currentAntar?.end ||
    null;

  return {
    mahadasha: mahaName,
    antardasha: antarName,
    start: startStr,
    end: endStr,
  };
}

// MAIN ROUTE → /current-dasha
app.get("/current-dasha", async (req, res) => {
  try {
    const { dob, tob } = req.query;

    if (!dob || !tob) {
      return res.status(400).json({
        success: false,
        error:
          "Missing dob or tob parameter (use format: dob=YYYY-MM-DD&tob=HH:MM)",
      });
    }

    // Astrology API se raw data
    const raw = await getDasha({ dob, tob });

    // Clean kaam: sirf current mahadasha / antardasha
    const current = extractCurrentDasha(raw);

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
