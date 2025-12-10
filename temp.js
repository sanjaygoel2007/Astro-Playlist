import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

// Fixed coordinates + timezone (aapne diye hue)
const FIXED_LATITUDE = 28.7041;   // 28.7041 N
const FIXED_LONGITUDE = 77.1025;  // 77.1025 E
const FIXED_TIMEZONE = 5.5;       // IST

const ASTRO_BASE_URL =
  process.env.ASTRO_BASE_URL || 'https://json.freeastrologyapi.com';
const ASTRO_API_KEY = process.env.ASTRO_API_KEY;
const VIMSOTTARI_MAHA_ANTAR_PATH =
  process.env.ASTRO_VDASHA_PATH || '/vimsottari/maha-dasas-and-antar-dasas';

// --- Helper to call FreeAstrologyAPI ---
async function callAstroAPI(path, payload) {
  if (!ASTRO_API_KEY) {
    throw new Error('ASTRO_API_KEY is not set');
  }

  const url = `${ASTRO_BASE_URL}${path}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ASTRO_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Astro API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data;
}

// DOB: "YYYY-MM-DD", TOB: "HH:MM"
function parseDobTob(dob, tob) {
  const [yearStr, monthStr, dateStr] = dob.split('-');
  const [hourStr, minuteStr] = tob.split(':');

  const year = Number(yearStr);
  const month = Number(monthStr);
  const date = Number(dateStr);
  const hours = Number(hourStr);
  const minutes = Number(minuteStr);
  const seconds = 0;

  return { year, month, date, hours, minutes, seconds };
}

// Find which dasha period is active "now"
function findCurrentPeriod(periods, now = new Date()) {
  if (!Array.isArray(periods)) return null;

  for (const p of periods) {
    const startStr =
      p.start_iso_utc || p.start || p.from || p.start_date || p.startDate;
    const endStr =
      p.end_iso_utc || p.end || p.to || p.end_date || p.endDate;

    if (!startStr || !endStr) continue;

    const start = new Date(startStr);
    const end = new Date(endStr);

    if (now >= start && now <= end) {
      return { period: p, start, end };
    }
  }

  return null;
}

/**
 * MAIN FUNCTION:
 * getCurrentDasha({ dob: "YYYY-MM-DD", tob: "HH:MM" })
 */
export async function getCurrentDasha({ dob, tob }) {
  const { year, month, date, hours, minutes, seconds } = parseDobTob(dob, tob);

  const payload = {
    year,
    month,
    date,
    hours,
    minutes,
    seconds,
    latitude: FIXED_LATITUDE,
    longitude: FIXED_LONGITUDE,
    timezone: FIXED_TIMEZONE,
    config: {
      observation_point: 'topocentric',
      ayanamsha: 'lahiri',
    },
  };

  const raw = await callAstroAPI(VIMSOTTARI_MAHA_ANTAR_PATH, payload);

  const now = new Date();

  // Response ke andar maha-dashas ki list nikaalna
  const mahaList =
    raw?.mahadashas ||
    raw?.maha_dasas ||
    raw?.vimsottari_mahadashas ||
    raw?.data ||
    [];

  const currentMaha = findCurrentPeriod(mahaList, now);
  if (!currentMaha) {
    console.log('DEBUG RAW RESPONSE:', JSON.stringify(raw, null, 2));
    throw new Error('Current Mahadasha nahi mil paayi (response format check karo).');
  }

  const mahaObj = currentMaha.period;

  const mahadasha =
    mahaObj.lord ||
    mahaObj.planet ||
    mahaObj.dasha_lord ||
    mahaObj.name;

  if (!mahadasha) {
    console.log('DEBUG MAHA OBJ:', mahaObj);
    throw new Error('Mahadasha lord field nahi mila (lord/planet/name).');
  }

  const antarList =
    mahaObj.antardashas ||
    mahaObj.antar_dasas ||
    mahaObj.antardasha ||
    [];

  const currentAnta = findCurrentPeriod(antarList, now);

  if (!currentAnta) {
    // Agar antar list nahi mili, to maha ko hi antar maan lo
    return {
      mahadasha,
      antardasha: mahadasha,
      antardashaEnd: currentMaha.end,
      raw,
    };
  }

  const antaObj = currentAnta.period;

  const antardasha =
    antaObj.lord ||
    antaObj.planet ||
    antaObj.dasha_lord ||
    antaObj.name;

  const antardashaEnd = currentAnta.end;

  return {
    mahadasha,
    antardasha,
    antardashaEnd,
    raw,
  };
}
