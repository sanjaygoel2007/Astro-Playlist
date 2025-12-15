// backend/dasha/dashaCalculator.js
import fetch from "node-fetch";

/**
 * ===============================
 * Prokerala OAuth Token Handling
 * ===============================
 */

let cachedToken = null;
let tokenExpiry = 0;

async function getProkeralaToken() {
  const now = Date.now();

  // reuse token if valid
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
    throw new Error("Failed to obtain Prokerala access token");
  }

  cachedToken = data.access_token;
  tokenExpiry = now + (data.expires_in - 60) * 1000;

  return cachedToken;
}

/**
 * =====================================
 * Calculate Current Vimshottari Dasha
 * =====================================
 */
export async function calculateCurrentDasha(dob, tob, lat, lon) {
  const token = await getProkeralaToken();

  const datetime = `${dob}T${tob}:00+05:30`;

  const url =
    "https://api.prokerala.com/v2/astrology/vimshottari-dasha" +
    `?datetime=${encodeURIComponent(datetime)}` +
    `&latitude=${lat}` +
    `&longitude=${lon}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const json = await res.json();

  /**
   * ===============================
   * Robust response extraction
   * (handles all Prokerala variants)
   * ===============================
   */

  let current = null;

  // Most common
  if (json?.data?.dasha?.current) {
    current = json.data.dasha.current;
  }

  // Alternative formats
  else if (json?.data?.current) {
    current = json.data.current;
  }

  else if (json?.data?.periods && Array.isArray(json.data.periods)) {
    current = json.data.periods[0];
  }

  if (!current) {
    console.error("Unexpected Prokerala response:", JSON.stringify(json, null, 2));
    throw new Error("Unable to parse current dasha from Prokerala response");
  }

  /**
   * ===============================
   * Normalize output
   * ===============================
   */
  const mahadasha =
    current.mahadasha?.name ||
    current.mahadasha ||
    current.major?.name;

  const antardasha =
    current.antardasha?.name ||
    current.antardasha ||
    current.sub?.name;

  const antardashaEnd =
    current.antardasha?.end ||
    current.antardasha_end ||
    current.end;

  if (!mahadasha || !antardasha) {
    throw new Error("Incomplete dasha data received from Prokerala");
  }

  return {
    success: true,
    source: "prokerala",
    mahadasha,
    antardasha,
    antardasha_end_date: antardashaEnd || null
  };
}
