import fetch from "node-fetch";

const TOKEN_URL = "https://api.prokerala.com/token";
const API_BASE = "https://api.prokerala.com/v2/astrology";

let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", process.env.PROKERALA_CLIENT_ID);
  params.append("client_secret", process.env.PROKERALA_CLIENT_SECRET);

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  });

  const data = await res.json();

  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

  return cachedToken;
}

export async function getVimshottariDasha({ dob, tob, lat, lon, tz }) {
  const token = await getAccessToken();

  const datetime = `${dob}T${tob}:00`;
  const url =
    `${API_BASE}/vimshottari-dasha?` +
    `datetime=${encodeURIComponent(datetime)}` +
    `&latitude=${lat}` +
    `&longitude=${lon}` +
    `&timezone=${tz}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();

  const maha = data.data.current.mahadasha;
  const antara = data.data.current.antardasha;
  const endDate = data.data.current.antardasha_end_date;

  return {
    success: true,
    source: "prokerala",
    mahadasha: maha,
    antardasha: antara,
    antardasha_end_date: endDate
  };
}
