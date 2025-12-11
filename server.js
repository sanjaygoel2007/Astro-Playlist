// server.js (updated)
// Assumes: package.json "type":"module"
// Ensure env: ASTRO_API_KEY, DATABASE_URL, PORT (optional)

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import pkg from "pg";
const { Client } = pkg;
import { getDasha } from "./src/astrologyService.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Helper function to create pg client
function makeClient() {
  return new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
}

/**
 * Basic root healthcheck
 */
app.get("/", (req, res) => {
  res.send("Astro Playlist backend is running ⚡");
});

/**
 * MAIN ROUTE → /current-dasha
 * Query params: dob=YYYY-MM-DD&tob=HH:MM
 * Returns processed result (mahadasha + antardasha) and original raw API data.
 */
app.get("/current-dasha", async (req, res) => {
  try {
    const { dob, tob } = req.query;

    if (!dob || !tob) {
      return res.status(400).json({
        success: false,
        error: "Missing dob or tob parameter (use format dob=yyyy-mm-dd&tob=hh:mm)"
      });
    }

    // Call your astrology service
    const raw = await getDasha({ dob, tob });

    // Try to find current maha & antar for "today" (server time)
    // If API returns nested structure where keys are mahadasha names and values are maps of sub-dashas,
    // then we will parse and pick the maha whose start<=now<end and the first antar inside it that contains now.
    const now = new Date();

    // If API returns object with {"statusCode":200,"output":"{...json...}"} (stringified),
    // attempt to unwrap.
    let parsed = raw;
    if (typeof raw === "object" && raw.output && typeof raw.output === "string") {
      try {
        parsed = JSON.parse(raw.output);
      } catch (e) {
        // leave parsed = raw
      }
    }

    // If parsed is a string that itself is JSON:
    if (typeof parsed === "string") {
      try {
        parsed = JSON.parse(parsed);
      } catch (e) { /* ignore */ }
    }

    // parsed is expected to be an object with top-level mahadashas
    let mahaResult = null;
    let antarResult = null;
    try {
      // parsed might be { "Moon": {...}, "Mars": {...}, ... } where for each maha there are sub objects.
      const mahaNames = Object.keys(parsed || {});
      for (const m of mahaNames) {
        const mahaObj = parsed[m];
        // mahaObj might contain a property for the maha itself (e.g., mahaObj[m] with start_time/end_time)
        // or the API might be differently structured. We'll attempt several ways.
        let mahaStart = null;
        let mahaEnd = null;

        // If mahaObj contains property with same name:
        if (mahaObj && typeof mahaObj === "object" && mahaObj[m] && mahaObj[m].start_time) {
          mahaStart = new Date(mahaObj[m].start_time);
          mahaEnd = new Date(mahaObj[m].end_time);
        } else if (mahaObj && mahaObj.start_time) {
          // maybe top-level contained start_time
          mahaStart = new Date(mahaObj.start_time);
          mahaEnd = new Date(mahaObj.end_time);
        } else {
          // Try to infer: some APIs just provide the timeline of sub-dashas only.
          // We'll skip if no start_time present.
        }

        if (mahaStart && mahaEnd && now >= mahaStart && now < mahaEnd) {
          mahaResult = { name: m, start_time: mahaStart.toISOString(), end_time: mahaEnd.toISOString() };

          // find antardasha inside mahaObj (first whose interval contains now)
          const subNames = Object.keys(mahaObj || {});
          for (const s of subNames) {
            // skip if s === m (the maha entry itself)
            if (!mahaObj[s] || !mahaObj[s].start_time) continue;
            const sStart = new Date(mahaObj[s].start_time);
            const sEnd = new Date(mahaObj[s].end_time);
            if (now >= sStart && now < sEnd) {
              antarResult = { name: s, start_time: sStart.toISOString(), end_time: sEnd.toISOString() };
              break;
            }
          }

          // if no antar matched by date, pick the first antar (fallback)
          if (!antarResult) {
            for (const s of subNames) {
              if (mahaObj[s] && mahaObj[s].start_time) {
                const sStart = new Date(mahaObj[s].start_time);
                const sEnd = new Date(mahaObj[s].end_time);
                antarResult = { name: s, start_time: sStart.toISOString(), end_time: sEnd.toISOString() };
                break;
              }
            }
          }

          break;
        }
      }
    } catch (e) {
      // parsing error -> continue
    }

    // If we didn't detect maha/antar from parsed, return raw data
    if (!mahaResult) {
      return res.json({ success: true, message: "Could not auto-detect current mahadasha from API response. Returning raw.", raw: parsed });
    }

    return res.json({
      success: true,
      dob,
      tob,
      mahandantar: {
        mahadasha: mahaResult,
        antardasha: antarResult
      },
      raw: parsed
    });

  } catch (error) {
    console.error("current-dasha error:", error);
    return res.status(500).json({ success: false, error: error.message || "Server error" });
  }
});

/**
 * Browser SQL Admin Page - GET /sql
 * Simple textarea UI that posts to /run-sql
 */
app.get("/sql", (req, res) => {
  res.send(`
    <h2>Astro SQL Admin Panel</h2>
    <p>Use this panel carefully. It runs SQL on your Render database.</p>
    <form onsubmit="runSQL(event)">
      <textarea id="query" name="query" rows="12" cols="90" placeholder="Write SQL here..."></textarea><br/>
      <button type="submit">Run SQL</button>
    </form>
    <pre id="output" style="background:#f5f5f5;padding:10px;margin-top:12px;"></pre>
    <script>
      async function runSQL(e) {
        e.preventDefault();
        const query = document.getElementById('query').value;
        const res = await fetch('/run-sql', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ query })
        });
        const data = await res.json();
        document.getElementById('output').innerText = JSON.stringify(data, null, 2);
      }
    </script>
  `);
});

/**
 * Run arbitrary SQL (POST /run-sql)
 * Body: { query: "SQL HERE" }
 */
app.post("/run-sql", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ success: false, error: "SQL query missing" });

  let client;
  try {
    client = makeClient();
    await client.connect();
    const result = await client.query(query);
    await client.end();
    return res.json({ success: true, rowCount: result.rowCount, rows: result.rows });
  } catch (err) {
    if (client) {
      try { await client.end(); } catch(e){/* ignore */ }
    }
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Save a user submission from frontend:
 * POST /submit
 * body: { name, dob, tob, place, problem, mobile, language }
 */
app.post("/submit", async (req, res) => {
  const { name, dob, tob, place, problem, mobile, language } = req.body;
  if (!name || !dob || !tob) {
    return res.status(400).json({ success: false, error: "Missing required fields: name,dob,tob" });
  }

  const insertSQL = `
    INSERT INTO users (name, dob, tob, place, problem, mobile, language)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING id, created_at;
  `;
  let client;
  try {
    client = makeClient();
    await client.connect();
    const result = await client.query(insertSQL, [name, dob, tob, place || null, problem || null, mobile || null, language || null]);
    await client.end();

    return res.json({ success: true, inserted: result.rows[0] });

  } catch (err) {
    if (client) { try { await client.end(); } catch(e){} }
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Quick endpoint to ensure DATABASE is reachable
 */
app.get("/db-check", async (req, res) => {
  let client;
  try {
    client = makeClient();
    await client.connect();
    const q = await client.query("SELECT NOW() as now");
    await client.end();
    return res.json({ success: true, now: q.rows[0].now });
  } catch (err) {
    if (client) { try { await client.end(); } catch(e){} }
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
