// backend/dasha/dashaCalculator.js
import fetch from "node-fetch";

/* ================= TOKEN HANDLING ================= */

let cachedToken = null;
let tokenExpiry = 0;

async function getProkeralaToken() {
  const now = Date.now();

  if (cachedToken && now < tokenExpiry) {
    return cachedToken;
  }

  const clientId = process.env.PROKERALA_CLIENT_ID;
  const clientSecret = process.env.PROKERALA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PROKERALA_CLIENT_ID / PROKERALA_CLIENT_SECRET missing");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://api.prokerala.com/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  const data = await res.json();

  if (!res.ok || !data.access_token) {
    throw new Error("Failed to obtain Prokerala token");
  }

  cachedToken = data.access_token;
  tokenExpiry = now + (data.expires_in - 60) * 1000;

  return cachedToken;
}

/* ================= MAIN FUNCTION ================= */

export async function calculateCurrentDasha(dob, tob, lat, lon) {
  const token = await getProkeralaToken();

  const datetime = `${dob}T${tob}:00+05:30`;

  const url =
    "https://api.prokerala.com/v2/astrology/vimshottari-dasha" +
    `?datetime=${encodeURIComponent(datetime)}` +
    `&latitude=${lat}` +
    `&longitude=${lon}` +
    `&ayanamsa=1`; // Lahiri

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const json = await res.json();

  const periods = json?.data?.periods;

  if (!Array.isArray(periods) || periods.length === 0) {
    console.error("Prokerala raw response:", JSON.stringify(json, null, 2));
    throw new Error("No Vimshottari periods returned by Prokerala");
  }

  const today = new Date();

  // ✅ Find CURRENT dasha by date
  const current = periods.find(p => {
    const start = new Date(p.start);
    const end = new Date(p.end);
    return today >= start && today <= end;
  });

  if (!current) {
    throw new Error("Unable to determine current dasha from periods");
  }

  return {
    success: true,
    source: "prokerala",
    mahadasha: current.mahadasha.name,
    antardasha: current.antardasha.name,
    antardasha_end_date: current.end
  };
}
