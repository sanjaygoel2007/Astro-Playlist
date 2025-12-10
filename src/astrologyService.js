// astrologyService.js
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const ASTRO_API_KEY = process.env.ASTRO_API_KEY;
const LAT = 28.7041;
const LON = 77.1025;
const TZ = 5.5;

// dob = "YYYY-MM-DD", tob = "HH:MM"
function parseDobTob(dob, tob) {
  const [year, month, date] = dob.split("-").map(Number);
  const [hours, minutes] = tob.split(":").map(Number);
  const seconds = 0;
  return { year, month, date, hours, minutes, seconds };
}

export async function getCurrentDasha({ dob, tob }) {
  if (!ASTRO_API_KEY) {
    throw new Error("ASTRO_API_KEY missing in environment");
  }

  const { year, month, date, hours, minutes, seconds } = parseDobTob(dob, tob);

  const payload = {
    year,
    month,
    date,
    hours,
    minutes,
    seconds,
    latitude: LAT,
    longitude: LON,
    timezone: TZ,
    config: {
      observation_point: "topocentric",
      ayanamsha: "lahiri",
    },
  };

  const res = await fetch(
    "https://json.freeastrologyapi.com/vimsottari/maha-dasas-and-antar-dasas",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ASTRO_API_KEY,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Astro API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  // फिलहाल पूरा raw data ही return कर रहे हैं
  return data;
}
