// server.js
import express from "express";
import dotenv from "dotenv";
import { getDasha } from "./src/astrologyService.js";

dotenv.config();
const app = express();
app.use(express.json());

function parseApiOutput(data) {
  // data may be: { statusCode:200, output: "{"Moon":{...},...}" }
  // or already parsed object; handle both.
  if (!data) return null;

  let obj = null;
  if (typeof data === "string") {
    try {
      obj = JSON.parse(data);
    } catch (e) {
      return null;
    }
  } else if (data.output && typeof data.output === "string") {
    try {
      obj = JSON.parse(data.output);
    } catch (e) {
      return null;
    }
  } else if (data.output && typeof data.output === "object") {
    obj = data.output;
  } else if (typeof data === "object") {
    obj = data;
  }
  return obj;
}

function toDateUTC(s) {
  // API format: "YYYY-MM-DD HH:MM:SS"
  // We'll treat it as UTC by appending 'Z'. 
  // If API returns local-time, adjust logic accordingly.
  if (!s) return null;
  const iso = s.replace(" ", "T") + "Z";
  const d = new Date(iso);
  if (isNaN(d)) return null;
  return d;
}

app.get("/", (req, res) => {
  res.send("Astro Playlist backend is running ⚡");
});

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
    return res.json({ success: true, raw });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

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
    const parsed = parseApiOutput(raw);
    if (!parsed || typeof parsed !== "object") {
      return res.status(500).json({ success: false, error: "Invalid API response format or empty dasha list" });
    }

    const now = new Date();

    // Build array of mahadashas with start/end and their inner antardashas
    const mahaList = Object.keys(parsed).map((mahaName) => {
      const inner = parsed[mahaName];
      // mahaStart is the start_time of inner[mahaName] if exists
      const mahaStartStr = inner && inner[mahaName] && inner[mahaName].start_time;
      const mahaStart = toDateUTC(mahaStartStr);

      // mahaEnd is max of all inner end_time values
      let mahaEnd = null;
      const antars = [];
      for (const antarName of Object.keys(inner || {})) {
        const it = inner[antarName];
        const s = toDateUTC(it.start_time);
        const e = toDateUTC(it.end_time);
        antars.push({
          name: antarName,
          start: s,
          end: e,
        });
        if (e && (!mahaEnd || e > mahaEnd)) mahaEnd = e;
      }

      return {
        mahaName,
        mahaStart,
        mahaEnd,
        antardashas: antars.sort((a, b) => (a.start && b.start ? a.start - b.start : 0)),
      };
    });

    // Filter out mahadashas that ended before now
    const futureMahas = mahaList.filter((m) => m.mahaEnd && m.mahaEnd >= now);

    if (!futureMahas.length) {
      return res.json({ success: false, error: "No dasha intervals found in API response" });
    }

    // Sort by mahaStart ascending (earliest upcoming/current first)
    futureMahas.sort((a, b) => {
      if (!a.mahaStart) return 1;
      if (!b.mahaStart) return -1;
      return a.mahaStart - b.mahaStart;
    });

    const pickedMaha = futureMahas[0];

    // Find current or next antardasha inside this maha
    const curAntar = pickedMaha.antardashas.find((ant) => {
      return ant.end && ant.end >= now;
    });

    const selectedAntar = curAntar || (pickedMaha.antardashas.length ? pickedMaha.antardashas[0] : null);

    if (!selectedAntar) {
      return res.json({ success: false, error: "No antardasha intervals found in selected mahadasha" });
    }

    // Return readable response
    return res.json({
      success: true,
      dob,
      tob,
      mahadasha: {
        name: pickedMaha.mahaName,
        start_time: pickedMaha.mahaStart ? pickedMaha.mahaStart.toISOString() : null,
        end_time: pickedMaha.mahaEnd ? pickedMaha.mahaEnd.toISOString() : null,
      },
      antardasha: {
        name: selectedAntar.name,
        start_time: selectedAntar.start ? selectedAntar.start.toISOString() : null,
        end_time: selectedAntar.end ? selectedAntar.end.toISOString() : null,
      },
      // debugging: include original parsed (optional)
      debug: {
        maha_count: mahaList.length,
        maha_candidates: futureMahas.map((m) => ({
          name: m.mahaName,
          start: m.mahaStart ? m.mahaStart.toISOString() : null,
          end: m.mahaEnd ? m.mahaEnd.toISOString() : null,
        })),
      },
    });
  } catch (err) {
    console.error("Error in /current-dasha:", err);
    return res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
