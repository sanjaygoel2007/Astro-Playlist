// backend/server.js
// Requires: NODE 16+
// Ensure env: DATABASE_URL, ASTRO_API_KEY (optional), ADMIN_SQL_KEY (optional), PORT (optional)

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import pkg from "pg";
const { Pool } = pkg;

import { getDasha } from "./src/astrologyService.js"; // adjust path if needed
import { sendOTP, verifyOTP } from "./src/otpService.js";

dotenv.config();

const {
  DATABASE_URL,
  ASTRO_API_KEY,
  ADMIN_SQL_KEY,
  FAST2SMS_API_KEY,
  PORT = 3000,
  NODE_ENV = "production"
} = process.env;

if (!DATABASE_URL) {
  console.warn("WARNING: DATABASE_URL env missing. Database features will be disabled.");
}

let pool = null;
if (DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: DATABASE_URL,
      // If your provider requires SSL (e.g. Render), keep rejectUnauthorized: false
      ssl: (NODE_ENV === "production") ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });
    
    // Test connection
    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });
  } catch (err) {
    console.error('Failed to create database pool:', err.message);
    pool = null;
  }
}

async function ensureSchema() {
  if (!pool) {
    console.warn("DB: Database not available, skipping schema creation");
    return;
  }
  
  let client;
  try {
    client = await pool.connect();
    // Submissions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        mobile_number TEXT NOT NULL,
        name TEXT NOT NULL,
        date_of_birth DATE NOT NULL,
        time_of_birth TEXT,
        place_of_birth TEXT NOT NULL,
        problems INTEGER[],
        mahadasha TEXT,
        antardasha TEXT,
        antardasha_end_date TIMESTAMPTZ,
        playlist_url TEXT,
        playlist_name TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Star/Problem mappings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS star_problem_mappings (
        id SERIAL PRIMARY KEY,
        star TEXT NOT NULL,
        problem_id INTEGER NOT NULL,
        sno INTEGER NOT NULL,
        video_url TEXT NOT NULL,
        mapping_key TEXT UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(star, problem_id, sno)
      );
    `);

    // Create index on mapping_key for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_mapping_key ON star_problem_mappings(mapping_key);
    `);

    // Create index on mobile_number for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_mobile_number ON submissions(mobile_number);
    `);

    console.log("DB: All tables are ready");
  } catch (err) {
    console.error("DB: Schema creation failed:", err.message);
    if (err.message.includes("ENOTFOUND") || err.message.includes("getaddrinfo")) {
      console.error("DB: Database hostname appears to be incorrect. Please check your DATABASE_URL.");
      console.error("DB: Expected format: postgresql://user:pass@host.domain.com/dbname");
    }
  } finally {
    if (client) client.release();
  }
}

// Helper function to check database availability
function checkDatabase() {
  if (!pool) {
    throw new Error("Database is not available. Please check your DATABASE_URL configuration.");
  }
}

(async () => {
  try {
    await ensureSchema();
  } catch (err) {
    console.warn("Schema init failed (continuing):", err.message || err);
  }
})();

const app = express();

// CORS configuration - Allow all origins for development
// Enable CORS for all routes
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow all origins
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Type');
  res.header('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Also use cors middleware as backup
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// parse JSON bodies
app.use(express.json());
// parse html form bodies (for testing with browser form)
app.use(express.urlencoded({ extended: true }));

// Root
app.get("/", (req, res) => {
  res.send("Astro Playlist backend is running ⚡");
});

// ==================== AUTH ENDPOINTS ====================

/**
 * POST /api/auth/send-otp
 * Body: { mobileNumber: "+91XXXXXXXXXX" }
 */
app.post("/api/auth/send-otp", async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    if (!mobileNumber) {
      return res.status(400).json({ success: false, error: "Mobile number is required" });
    }

    const result = await sendOTP(mobileNumber);
    return res.json(result);
  } catch (error) {
    console.error("Send OTP error:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to send OTP" });
  }
});

/**
 * POST /api/auth/verify-otp
 * Body: { mobileNumber: "+91XXXXXXXXXX", otp: "123456" }
 */
app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;
    if (!mobileNumber || !otp) {
      return res.status(400).json({ success: false, error: "Mobile number and OTP are required" });
    }

    const result = await verifyOTP(mobileNumber, otp);
    return res.json(result);
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(400).json({ success: false, error: error.message || "OTP verification failed" });
  }
});

/**
 * Simple browser form for manual testing (GET /submit)
 * Use in browser: GET /submit -> fill form -> submit -> hits POST /submit
 */
app.get("/submit", (req, res) => {
  res.send(`
    <h3>Submit (test form)</h3>
    <form method="POST" action="/submit">
      <input name="name" placeholder="Name" required/><br/>
      <input name="dob" placeholder="DOB YYYY-MM-DD" required/><br/>
      <input name="tob" placeholder="Time HH:MM" required/><br/>
      <input name="place" placeholder="Place"/><br/>
      <input name="problem" placeholder="Problem"/><br/>
      <input name="mobile" placeholder="Mobile"/><br/>
      <input name="language" placeholder="Language"/><br/><br/>
      <button type="submit">Submit</button>
    </form>
  `);
});

// ==================== SUBMISSION ENDPOINTS ====================

/**
 * POST /api/submit
 * Body: { mobileNumber, token, name, dateOfBirth, timeOfBirth, placeOfBirth, problems: [1,2,3] }
 */
app.post("/api/submit", async (req, res) => {
  let client;
  try {
    const { mobileNumber, token, name, dateOfBirth, timeOfBirth, placeOfBirth, problems } = req.body;

    // Validate required fields (token is now optional)
    if (!mobileNumber || !name || !dateOfBirth || !placeOfBirth) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields: mobileNumber, name, dateOfBirth, placeOfBirth" 
      });
    }

    if (!Array.isArray(problems) || problems.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: "At least one problem must be selected" 
      });
    }

    // Clean mobile number
    const cleanMobile = mobileNumber.replace(/^\+91/, "");

    // Calculate Mahadasha and Antardasha
    const tob = timeOfBirth || "12:00"; // Default to noon if not provided
    let mahadasha = null;
    let antardasha = null;
    let antardashaEndDate = null;

    try {
      const dashaResult = await getDasha({ dob: dateOfBirth, tob });
      const now = new Date();

      let parsed = dashaResult;
      if (typeof dashaResult === "object" && dashaResult.output && typeof dashaResult.output === "string") {
        try { parsed = JSON.parse(dashaResult.output); } catch(e){ /* ignore */ }
      }
      if (typeof parsed === "string") {
        try { parsed = JSON.parse(parsed); } catch(e){ /* ignore */ }
      }

      // Extract current mahadasha and antardasha
      const mahaNames = Object.keys(parsed || {});
      for (const m of mahaNames) {
        const mahaObj = parsed[m];
        let mahaStart = null;
        let mahaEnd = null;
        if (mahaObj && typeof mahaObj === "object" && mahaObj[m] && mahaObj[m].start_time) {
          mahaStart = new Date(mahaObj[m].start_time);
          mahaEnd = new Date(mahaObj[m].end_time);
        } else if (mahaObj && mahaObj.start_time) {
          mahaStart = new Date(mahaObj.start_time);
          mahaEnd = new Date(mahaObj.end_time);
        }
        if (mahaStart && mahaEnd && now >= mahaStart && now < mahaEnd) {
          mahadasha = m;
          const subNames = Object.keys(mahaObj || {});
          for (const s of subNames) {
            if (!mahaObj[s] || !mahaObj[s].start_time) continue;
            const sStart = new Date(mahaObj[s].start_time);
            const sEnd = new Date(mahaObj[s].end_time);
            if (now >= sStart && now < sEnd) {
              antardasha = s;
              antardashaEndDate = sEnd.toISOString();
              break;
            }
          }
          if (!antardasha && subNames.length > 0) {
            // Get first antardasha if current not found
            const firstSub = subNames[0];
            if (mahaObj[firstSub] && mahaObj[firstSub].start_time) {
              antardasha = firstSub;
              antardashaEndDate = new Date(mahaObj[firstSub].end_time).toISOString();
            }
          }
          break;
        }
      }
    } catch (dashaError) {
      console.warn("Dasha calculation error:", dashaError);
      // Continue without dasha info
    }

    // Generate playlist name: Mobile Number + Name
    const playlistName = `${cleanMobile} - ${name}`;

    // TODO: Create YouTube playlist and get URL
    // For now, return a placeholder
    const playlistUrl = null; // Will be populated when YouTube API is integrated

    // Insert into database
    checkDatabase();
    client = await pool.connect();
    const insertSQL = `
      INSERT INTO submissions (
        mobile_number, name, date_of_birth, time_of_birth, place_of_birth,
        problems, mahadasha, antardasha, antardasha_end_date,
        playlist_url, playlist_name
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, created_at;
    `;

    const result = await client.query(insertSQL, [
      cleanMobile,
      name,
      dateOfBirth,
      timeOfBirth || null,
      placeOfBirth,
      problems,
      mahadasha,
      antardasha,
      antardashaEndDate,
      playlistUrl,
      playlistName
    ]);

    // Get problem names for display (optional - can be enhanced)
    const problemNames = problems.map(id => `Problem ${id}`).join(", ");

    return res.json({
      success: true,
      message: "Submission successful",
      name,
      mobileNumber: cleanMobile,
      mahadasha,
      antardasha,
      antardashaEndDate,
      playlistUrl,
      playlistName,
      problems: problemNames.split(", "),
      id: result.rows[0].id
    });

  } catch (err) {
    console.error("Submit error:", err);
    return res.status(500).json({ success: false, error: err.message || "Server error" });
  } finally {
    if (client) client.release();
  }
});

/**
 * GET /api/submissions/:mobileNumber
 * Get all submissions for a mobile number
 */
app.get("/api/submissions/:mobileNumber", async (req, res) => {
  let client;
  try {
    checkDatabase();
    const { mobileNumber } = req.params;
    const cleanMobile = mobileNumber.replace(/^\+91/, "");

    client = await pool.connect();
    const result = await client.query(
      `SELECT 
        id, mobile_number, name, date_of_birth, time_of_birth, place_of_birth,
        problems, mahadasha, antardasha, antardasha_end_date,
        playlist_url, playlist_name, created_at
      FROM submissions 
      WHERE mobile_number = $1 
      ORDER BY created_at DESC`,
      [cleanMobile]
    );

    return res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        mobileNumber: row.mobile_number,
        name: row.name,
        dateOfBirth: row.date_of_birth,
        timeOfBirth: row.time_of_birth,
        placeOfBirth: row.place_of_birth,
        problems: row.problems,
        mahadasha: row.mahadasha,
        antardasha: row.antardasha,
        antardashaEndDate: row.antardasha_end_date,
        playlistUrl: row.playlist_url,
        playlistName: row.playlist_name,
        createdAt: row.created_at
      }))
    });

  } catch (err) {
    console.error("Get submissions error:", err);
    return res.status(500).json({ success: false, error: err.message || "Server error" });
  } finally {
    if (client) client.release();
  }
});

/**
 * /current-dasha
 * Query params: dob=YYYY-MM-DD&tob=HH:MM
 * Returns parsed mahadasha/antardasha if available (calls getDasha)
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

    const raw = await getDasha({ dob, tob });
    const now = new Date();

    let parsed = raw;
    if (typeof raw === "object" && raw.output && typeof raw.output === "string") {
      try { parsed = JSON.parse(raw.output); } catch(e){ /* ignore */ }
    }
    if (typeof parsed === "string") {
      try { parsed = JSON.parse(parsed); } catch(e){ /* ignore */ }
    }

    let mahaResult = null;
    let antarResult = null;
    try {
      const mahaNames = Object.keys(parsed || {});
      for (const m of mahaNames) {
        const mahaObj = parsed[m];
        let mahaStart = null;
        let mahaEnd = null;
        if (mahaObj && typeof mahaObj === "object" && mahaObj[m] && mahaObj[m].start_time) {
          mahaStart = new Date(mahaObj[m].start_time);
          mahaEnd = new Date(mahaObj[m].end_time);
        } else if (mahaObj && mahaObj.start_time) {
          mahaStart = new Date(mahaObj.start_time);
          mahaEnd = new Date(mahaObj.end_time);
        }
        if (mahaStart && mahaEnd && now >= mahaStart && now < mahaEnd) {
          mahaResult = { name: m, start_time: mahaStart.toISOString(), end_time: mahaEnd.toISOString() };
          const subNames = Object.keys(mahaObj || {});
          for (const s of subNames) {
            if (!mahaObj[s] || !mahaObj[s].start_time) continue;
            const sStart = new Date(mahaObj[s].start_time);
            const sEnd = new Date(mahaObj[s].end_time);
            if (now >= sStart && now < sEnd) {
              antarResult = { name: s, start_time: sStart.toISOString(), end_time: sEnd.toISOString() };
              break;
            }
          }
          if (!antarResult) {
            for (const s of subNames) {
              if (mahaObj[s] && mahaObj[s].start_time) {
                antarResult = {
                  name: s,
                  start_time: new Date(mahaObj[s].start_time).toISOString(),
                  end_time: new Date(mahaObj[s].end_time).toISOString()
                };
                break;
              }
            }
          }
          break;
        }
      }
    } catch (e) {
      console.warn("Parsing error in /current-dasha:", e);
    }

    if (!mahaResult) {
      return res.json({ success: true, message: "Could not auto-detect current mahadasha from API response. Returning raw.", raw: parsed });
    }

    return res.json({
      success: true,
      dob,
      tob,
      mahandantar: { mahadasha: mahaResult, antardasha: antarResult },
      raw: parsed
    });

  } catch (error) {
    console.error("current-dasha error:", error);
    return res.status(500).json({ success: false, error: error.message || "Server error" });
  }
});

// ==================== ADMIN ENDPOINTS ====================

/**
 * GET /api/admin/star-problems
 * Get all star/problem mappings
 */
app.get("/api/admin/star-problems", async (req, res) => {
  let client;
  try {
    checkDatabase();
    client = await pool.connect();
    const result = await client.query(
      `SELECT id, star, problem_id, sno, video_url, mapping_key, created_at, updated_at
       FROM star_problem_mappings
       ORDER BY star, problem_id, sno`
    );

    return res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    console.error("Get star-problems error:", err);
    return res.status(500).json({ success: false, error: err.message || "Server error" });
  } finally {
    if (client) client.release();
  }
});

/**
 * POST /api/admin/star-problems
 * Body: { star, problemId, sno, videoUrl }
 */
app.post("/api/admin/star-problems", async (req, res) => {
  let client;
  try {
    const { star, problemId, sno, videoUrl } = req.body;

    if (!star || !problemId || !sno || !videoUrl) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: star, problemId, sno, videoUrl"
      });
    }

    const mappingKey = `${star}_${sno}`;

    checkDatabase();
    client = await pool.connect();

    // Upsert (insert or update)
    const result = await client.query(
      `INSERT INTO star_problem_mappings (star, problem_id, sno, video_url, mapping_key)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (mapping_key) 
       DO UPDATE SET 
         star = EXCLUDED.star,
         problem_id = EXCLUDED.problem_id,
         sno = EXCLUDED.sno,
         video_url = EXCLUDED.video_url,
         updated_at = NOW()
       RETURNING id, star, problem_id, sno, video_url, mapping_key, created_at, updated_at`,
      [star, problemId, sno, videoUrl, mappingKey]
    );

    return res.json({
      success: true,
      message: "Mapping saved successfully",
      data: result.rows[0]
    });

  } catch (err) {
    console.error("Save star-problem error:", err);
    return res.status(500).json({ success: false, error: err.message || "Server error" });
  } finally {
    if (client) client.release();
  }
});

// ==================== UTILITY ENDPOINTS ====================

/**
 * GET /db-check
 * Optional simple database check
 */
app.get("/db-check", async (req, res) => {
  let client;
  try {
    checkDatabase();
    client = await pool.connect();
    const q = await client.query("SELECT NOW() as now");
    return res.json({ success: true, now: q.rows[0].now });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (client) client.release();
  }
});

// 404 handler for debugging
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    success: false, 
    error: "Route not found",
    method: req.method,
    path: req.path,
    availableRoutes: [
      "GET /",
      "POST /api/auth/send-otp",
      "POST /api/auth/verify-otp",
      "GET /submit",
      "POST /api/submit",
      "GET /api/submissions/:mobileNumber",
      "GET /current-dasha",
      "GET /api/admin/star-problems",
      "POST /api/admin/star-problems",
      "GET /db-check"
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Available routes:`);
  console.log(`  GET  /api/admin/star-problems`);
  console.log(`  POST /api/admin/star-problems`);
});
