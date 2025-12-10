// server.js
import express from "express";
import dotenv from "dotenv";
import { getDasha } from "./src/astrologyService.js";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;
const app = express();

// Body parsers (HTML form + JSON)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ---------- DB SETUP (Postgres) ----------

const connectionString = process.env.DATABASE_URL;
let pool = null;
let tableReady = false;

if (connectionString) {
  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
}

async function ensureTable() {
  if (!pool || tableReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS playlist_requests (
      id SERIAL PRIMARY KEY,
      name TEXT,
      dob DATE,
      tob TEXT,
      place TEXT,
      problem TEXT,
      lang TEXT,
      mahadasha TEXT,
      antardasha TEXT,
      antardasha_end TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  tableReady = true;
}

async function saveRequest(row) {
  if (!pool) {
    console.log("No DATABASE_URL set, skipping DB save:", row);
    return { id: null };
  }
  await ensureTable();
  const result = await pool.query(
    `INSERT INTO playlist_requests
      (name, dob, tob, place, problem, lang, mahadasha, antardasha, antardasha_end)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING id`,
    [
      row.name,
      row.dob,
      row.tob,
      row.place,
      row.problem,
      row.lang,
      row.mahadasha,
      row.antardasha,
      row.antardasha_end,
    ]
  );
  return result.rows[0];
}

// ---------- DASHA HELPERS ----------

function parseApiOutput(data) {
  if (!data) return null;

  let obj = null;
  if (typeof data === "string") {
    try {
      obj = JSON.parse(data);
    } catch {
      return null;
    }
  } else if (data.output && typeof data.output === "string") {
    try {
      obj = JSON.parse(data.output);
    } catch {
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
  if (!s) return null;
  const iso = s.replace(" ", "T") + "Z";
  const d = new Date(iso);
  return isNaN(d) ? null : d;
}

async function computeCurrentDasha(dob, tob) {
  const raw = await getDasha({ dob, tob });
  const parsed = parseApiOutput(raw);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid API response format or empty dasha list");
  }

  const now = new Date();

  const mahaList = Object.keys(parsed).map((mahaName) => {
    const inner = parsed[mahaName];
    const mahaStartStr = inner && inner[mahaName] && inner[mahaName].start_time;
    const mahaStart = toDateUTC(mahaStartStr);

    let mahaEnd = null;
    const antars = [];
    for (const antarName of Object.keys(inner || {})) {
      const it = inner[antarName];
      const s = toDateUTC(it.start_time);
      const e = toDateUTC(it.end_time);
      antars.push({ name: antarName, start: s, end: e });
      if (e && (!mahaEnd || e > mahaEnd)) mahaEnd = e;
    }

    antars.sort((a, b) =>
      a.start && b.start ? a.start - b.start : 0
    );

    return { mahaName, mahaStart, mahaEnd, antardashas: antars };
  });

  const futureMahas = mahaList.filter((m) => m.mahaEnd && m.mahaEnd >= now);
  if (!futureMahas.length) {
    throw new Error("No dasha intervals found in API response");
  }

  futureMahas.sort((a, b) => {
    if (!a.mahaStart) return 1;
    if (!b.mahaStart) return -1;
    return a.mahaStart - b.mahaStart;
  });

  const pickedMaha = futureMahas[0];

  const curAntar =
    pickedMaha.antardashas.find((ant) => ant.end && ant.end >= now) ||
    pickedMaha.antardashas[0];

  if (!curAntar) {
    throw new Error("No antardasha intervals found in selected mahadasha");
  }

  return {
    mahadasha: {
      name: pickedMaha.mahaName,
      start_time: pickedMaha.mahaStart,
      end_time: pickedMaha.mahaEnd,
    },
    antardasha: {
      name: curAntar.name,
      start_time: curAntar.start,
      end_time: curAntar.end,
    },
    debug: {
      maha_count: mahaList.length,
    },
  };
}

// ---------- ROUTES ----------

app.get("/", (req, res) => {
  res.send("Astro Playlist backend is running ⚡");
});

// JSON API for other systems
app.get("/current-dasha", async (req, res) => {
  try {
    const { dob, tob } = req.query;
    if (!dob || !tob) {
      return res.status(400).json({
        success: false,
        error: "Missing dob or tob (use dob=YYYY-MM-DD&tob=HH:MM)",
      });
    }

    const result = await computeCurrentDasha(dob, tob);
    res.json({
      success: true,
      dob,
      tob,
      mahadasha: {
        name: result.mahadasha.name,
        start_time: result.mahadasha.start_time?.toISOString() || null,
        end_time: result.mahadasha.end_time?.toISOString() || null,
      },
      antardasha: {
        name: result.antardasha.name,
        start_time: result.antardasha.start_time?.toISOString() || null,
        end_time: result.antardasha.end_time?.toISOString() || null,
      },
      debug: result.debug,
    });
  } catch (err) {
    console.error("Error in /current-dasha:", err);
    res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

// ---------- FRONTEND FORM (with preferred language) ----------

app.get("/form", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Astro Playlist Form</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
        label { display: block; margin-top: 10px; }
        input, select { padding: 5px; width: 100%; max-width: 300px; }
        button { margin-top: 15px; padding: 8px 16px; }
      </style>
    </head>
    <body>
      <h2>Astro Playlist – User Details</h2>
      <form method="POST" action="/submit">
        <label>
          Name:
          <input type="text" name="name" required />
        </label>

        <label>
          Date of Birth:
          <input type="date" name="dob" required />
        </label>

        <label>
          Time of Birth:
          <input type="time" name="tob" required />
        </label>

        <label>
          Place of Birth:
          <input type="text" name="place" required />
        </label>

        <label>
          Problem:
          <select name="problem" required>
            <option value="marriage">Marriage</option>
            <option value="children">Children</option>
            <option value="money">Money</option>
            <option value="job">Job / Career</option>
            <option value="others">Others</option>
          </select>
        </label>

        <label>
          Preferred Language:
          <select name="lang" required>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
        </label>

        <button type="submit">Submit & Save</button>
      </form>
    </body>
    </html>
  `);
});

// ---------- FORM SUBMIT: calculate dasha + save in DB + show localized result ----------

app.post("/submit", async (req, res) => {
  try {
    const { name, dob, tob, place, problem, lang } = req.body;

    if (!name || !dob || !tob || !place || !problem || !lang) {
      return res.status(400).send("Missing required fields");
    }

    const result = await computeCurrentDasha(dob, tob);

    const row = {
      name,
      dob,
      tob,
      place,
      problem,
      lang,
      mahadasha: result.mahadasha.name,
      antardasha: result.antardasha.name,
      antardasha_end: result.antardasha.end_time,
    };

    const saved = await saveRequest(row);

    const texts = {
      en: {
        title: "Astro Playlist Result",
        saved: "Result Saved Successfully",
        recordId: "Record ID",
        userDetails: "User Details",
        currentDasha: "Current Dasha",
        mahadasha: "Mahadasha",
        antardasha: "Antardasha",
        antardashaEnd: "Antardasha Ends On",
        back: "Enter another user",
      },
      hi: {
        title: "ज्योतिष परिणाम",
        saved: "परिणाम सफलतापूर्वक सेव हो गया",
        recordId: "रिकॉर्ड आईडी",
        userDetails: "यूज़र विवरण",
        currentDasha: "वर्तमान दशा",
        mahadasha: "महादशा",
        antardasha: "अंतरदशा",
        antardashaEnd: "अंतरदशा समाप्त होने की तिथि",
        back: "नया यूज़र दर्ज करें",
      },
    };

    const t = texts[lang] || texts.en;

    res.send(`
      <!DOCTYPE html>
      <html lang="${lang}">
      <head>
        <meta charset="UTF-8" />
        <title>${t.title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
        </style>
      </head>
      <body>
        <h2>${t.saved} ✅</h2>
        ${
          saved.id
            ? `<p><strong>${t.recordId}:</strong> ${saved.id}</p>`
            : `<p><em>DB not configured (record not stored, only logged on server).</em></p>`
        }

        <h3>${t.userDetails}</h3>
        <ul>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>DOB:</strong> ${dob}</li>
          <li><strong>TOB:</strong> ${tob}</li>
          <li><strong>Place:</strong> ${place}</li>
          <li><strong>Problem:</strong> ${problem}</li>
          <li><strong>Language:</strong> ${lang}</li>
        </ul>

        <h3>${t.currentDasha}</h3>
        <ul>
          <li><strong>${t.mahadasha}:</strong> ${result.mahadasha.name}</li>
          <li><strong>${t.antardasha}:</strong> ${result.antardasha.name}</li>
          <li><strong>${t.antardashaEnd}:</strong> ${
            result.antardasha.end_time
              ? result.antardasha.end_time.toISOString()
              : "N/A"
          }</li>
        </ul>

        <p><a href="/form">${t.back}</a></p>
      </body>
      </html>
    `);
  } catch (err) {
    console.error("Error in /submit:", err);
    res.status(500).send("Server error: " + (err.message || String(err)));
  }
});

// ---------- Start server ----------

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
