// backend/dasha/dashaCalculator.js
// Accurate Vimshottari Dasha (Birth Nakshatra based)
// Node 16+ | type: module

import swisseph from "swisseph";
import path from "path";
import { fileURLToPath } from "url";

// ---------- Swiss Ephemeris setup ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

swisseph.set_ephe_path(__dirname); // ephemeris path

// ---------- Vimshottari order ----------
const DASHA_ORDER = [
  "Ketu", "Venus", "Sun", "Moon", "Mars",
  "Rahu", "Jupiter", "Saturn", "Mercury"
];

const DASHA_YEARS = {
  Ketu: 7,
  Venus: 20,
  Sun: 6,
  Moon: 10,
  Mars: 7,
  Rahu: 18,
  Jupiter: 16,
  Saturn: 19,
  Mercury: 17
};

// Nakshatra lords (27)
const NAKSHATRA_LORDS = [
  "Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury",
  "Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury",
  "Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury"
];

// ---------- Helpers ----------
function toJulian(dob, tob) {
  const [y, m, d] = dob.split("-").map(Number);
  const [hh, mm] = tob.split(":").map(Number);
  return swisseph.julday(y, m, d, hh + mm / 60, swisseph.GREG_CAL);
}

function addYears(date, years) {
  const d = new Date(date);
  d.setTime(d.getTime() + years * 365.2422 * 24 * 3600 * 1000);
  return d;
}

// ---------- MAIN FUNCTION ----------
export function calculateCurrentDasha(dob, tob) {
  // ---- Moon longitude ----
  const jd = toJulian(dob, tob);

  const moon = swisseph.calc_ut(jd, swisseph.SE_MOON);
  if (moon.error) throw new Error(moon.error);

  const moonLon = moon.longitude;

  // ---- Nakshatra ----
  const nakIndex = Math.floor(moonLon / (360 / 27));
  const nakLord = NAKSHATRA_LORDS[nakIndex];

  const nakStart = nakIndex * (360 / 27);
  const nakProgress = (moonLon - nakStart) / (360 / 27);

  // ---- Balance of Mahadasha at birth ----
  const mdYears = DASHA_YEARS[nakLord];
  const mdBalanceYears = mdYears * (1 - nakProgress);

  const birthDate = new Date(`${dob}T${tob}:00+05:30`);
  let cursorDate = addYears(birthDate, mdBalanceYears);

  // ---- Find current Mahadasha ----
  let mdIndex = DASHA_ORDER.indexOf(nakLord);
  let currentMD = nakLord;

  while (cursorDate < new Date()) {
    mdIndex = (mdIndex + 1) % 9;
    currentMD = DASHA_ORDER[mdIndex];
    cursorDate = addYears(cursorDate, DASHA_YEARS[currentMD]);
  }

  // ---- Antardasha ----
  const mdStart = addYears(cursorDate, -DASHA_YEARS[currentMD]);
  const mdDurationMs = DASHA_YEARS[currentMD] * 365.2422 * 24 * 3600 * 1000;

  let adStart = mdStart;
  let currentAD = null;
  let adEnd = null;

  for (let i = 0; i < 9; i++) {
    const adLord = DASHA_ORDER[(mdIndex + i) % 9];
    const adYears = (DASHA_YEARS[adLord] / 120) * DASHA_YEARS[currentMD];
    const adMs = adYears * 365.2422 * 24 * 3600 * 1000;
    const adFinish = new Date(adStart.getTime() + adMs);

    if (new Date() < adFinish) {
      currentAD = adLord;
      adEnd = adFinish;
      break;
    }
    adStart = adFinish;
  }

  return {
    birthNakshatra: nakIndex + 1,
    mahadasha: currentMD,
    antardasha: currentAD,
    antardashaEndDate: adEnd.toISOString().split("T")[0]
  };
}
