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
 * Recursively traverse any JSON value and collect all
 * objects that look like a dasha interval:
 *  - have some "start" field (start_date / start_time / start)
 *  - have some "end" field (end_date / end_time / end)
 *  - have some "lord/planet" info
 */
function collectIntervals(node, acc = []) {
  if (!node) return acc;

  if (Array.isArray(node)) {
    for (const item of node) collectIntervals(item, acc);
    return acc;
  }

  if (typeof node === "object") {
    const keys = Object.keys(node);

    const startKey = keys.find((k) => k.toLowerCase().includes("start"));
    const endKey = keys.find((k) => k.toLowerCase().includes("end"));

    // planet / lord names
    const mahaKey = keys.find((k) =>
      k.toLowerCase().match(/mah.*dasa.*lord|maha.*dasha.*lord|mah_dasa_lord/)
    );
    const antarKey = keys.find((k) =>
      k.toLowerCase().match(/antar.*dasa.*lord|anthar.*dasa.*lord|antar_dasa_lord/)
    );
    const genericPlanetKey = keys.find((k) =>
      k.toLowerCase().match(/planet|lord/)
    );

    if (startKey && endKey) {
      const startRaw = node[startKey];
      const endRaw = node[endKey];

      let start = typeof startRaw === "string" ? startRaw : null;
      let end = typeof endRaw === "string" ? endRaw : null;

      if (start && !start.includes("T")) start = start.replace(" ", "T");
      if (end && !end.includes("T")) end = end.replace(" ", "T");

      const startDate = start ? new Date(start) : null;
      const endDate = end ? new Date(end) : null;

      const mahaName = mahaKey ? node[mahaKey] : undefined;
      const antarName = antarKey ? node[antarKey] : undefined;
      const genericName = genericPlanetKey ? node[genericPlanetKey] : undefined;

      acc.push({
        raw: node,
        start,
        end,
        startDate,
        endDate,
        mahadasha: mahaName || undefined,
        antardasha: antarName || undefined,
        name: genericName || undefined,
      });
    }

    // go deeper
    for (const v of Object.values(node)) {
      collectIntervals(v, acc);
    }

    return acc;
  }

  return acc;
}

/**
 * Given raw API response, return current dasha:
 *  - remove all intervals whose end < now
 *  - sort remaining by startDate
 *  - pick the first one
 */
function extractCurrentFromRaw(raw) {
  const intervals = collectIntervals(raw, []);

  if (!intervals.length) {
    throw new Error("No dasha intervals found in API response");
  }

  const now = new Date();

  const futureOrCurrent = intervals.filter(
    (i) =>
      i.startDate instanceof Date &&
      !isNaN(i.startDate) &&
      i.endDate instanceof Date &&
      !isNaN(i.endDate) &&
      i.endDate >= now
  );

  const candidates = futureOrCurrent.length ? futureOrCurrent : intervals;

  candidates.sort((a, b) => a.startDate - b.startDate);

  const current = candidates[0];

  // best-effort: mahadasha & antardasha names
  const mahadasha =
    current.mahadasha ||
    current.name ||
    current.raw?.mah_dasa_lord ||
    current.raw?.mah_dasha_lord ||
    current.raw?.lord ||
    null;

  const antardasha =
    current.antardasha ||
    current.raw?.antar_dasa_lord ||
    current.raw?.antar_dasha_lord ||
    null;

  return {
    mahadasha,
    antardasha,
    start: current.start,
    end: current.end,
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

    // 1) FreeAstrologyAPI se full mahadasha+antardasha list
    const raw = await getDasha({ dob, tob });

    // 2) Purani dashaa hatao, current+future me se sabse pehli lo
    const current = extractCurrentFromRaw(raw);

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
