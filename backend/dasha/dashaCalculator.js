// backend/dasha/dashaCalculator.js
import fetch from "node-fetch";

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
    throw new Error("Prokerala client id/secret missing");
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
    throw new Error("Failed to get Prokerala token");
  }

  cachedToken = data.access_token;
  tokenExpiry = now + (data.expires_in - 60) * 1000;

  return cachedToken;
}

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

  const current = json?.data?.dasha?.current;

  if (!current) {
    throw new Error("Invalid response from Prokerala");
  }

  return {
    success: true,
    source: "prokerala",
    mahadasha: current.mahadasha,
    antardasha: current.antardasha,
    antardasha_end_date: current.antardasha_end_date
  };
}
