// backend/dasha/dashaCalculator.js
// Accurate Vimshottari Dasha (Sidereal – Lahiri)
// Node 16+ | type: module

import swisseph from "swisseph";
import path from "path";
import { fileURLToPath } from "url";

/* ================= Swiss Ephemeris setup ================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set ephemeris path
swisseph.set_ephe_path(__dirname);

// IMPORTANT: Set Lahiri Ayanamsa (Sidereal)
swisseph.set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);

/* ================= Vimshottari constants ================= */

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

// 27 Nakshatra lords
const NAKSHATRA_LORDS = [
  "Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury",
  "Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury",
  "Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury"
];

/* ================= Helpers ================= */

function toJulian(dob, tob) {
  const [y, m, d] = dob.split("-").map(Number);
  const [hh, mm] = tob.split(":").map(Number);
  return swisseph.julday(y, m, d, hh + mm / 60, swisseph.GREG_CAL);
}

function addYears(date, years) {
  return new Date(date.getTime() + years * 365.2422 * 24 * 3600 * 1000);
}

/* ================= MAIN FUNCTION ================= */

export function calculateCurrentDasha(dob, tob) {
  const now = new Date();

  /* ---- Birth date in IST ---- */
  const birthDate = new Date(`${dob}T${tob}:00+05:30`);

  /* ---- Moon longitude (SIDEREAL) ---- */
  const jd = toJulian(dob, tob);

  const moon = swisseph.calc_ut(
    jd,
    swisseph.SE_MOON,
    swisseph.SEFLG_SIDEREAL
  );

  if (moon.error) throw new Error(moon.error);

  const moonLon = moon.longitude; // 0–360 sidereal

  /* ---- Nakshatra ---- */
  const nakSize = 360 / 27;
  const nakIndex = Math.floor(moonLon / nakSize); // 0–26
  const nakLord = NAKSHATRA_LORDS[nakIndex];

  const nakStart = nakIndex * nakSize;
  const nakProgress = Math.min(
    Math.max((moonLon - nakStart) / nakSize, 0),
    1
  );

  /* ---- Balance of Mahadasha at birth ---- */
  const mdTotalYears = DASHA_YEARS[nakLord];
  const mdBalanceYears = mdTotalYears * (1 - nakProgress);

  /* ---- Find current Mahadasha correctly ---- */
  let mdIndex = DASHA_ORDER.indexOf(nakLord);
  let currentMD = nakLord;

  let mdStart = birthDate;
  let mdEnd = addYears(mdStart, mdBalanceYears);

  while (now >= mdEnd) {
    mdIndex = (mdIndex + 1) % 9;
    currentMD = DASHA_ORDER[mdIndex];
    mdStart = mdEnd;
    mdEnd = addYears(mdStart, DASHA_YEARS[currentMD]);
  }

  /* ---- Antardasha ---- */
  let adStart = mdStart;
  let currentAD = null;
  let adEnd = null;

  for (let i = 0; i < 9; i++) {
    const adLord = DASHA_ORDER[(mdIndex + i) % 9];
    const adYears =
      (DASHA_YEARS[adLord] / 120) * DASHA_YEARS[currentMD];
    const adFinish = addYears(adStart, adYears);

    if (now < adFinish) {
      currentAD = adLord;
      adEnd = adFinish;
      break;
    }
    adStart = adFinish;
  }

  /* ---- Final result ---- */
  return {
    system: "Vimshottari",
    ayanamsa: "Lahiri",
    birthNakshatra: nakIndex + 1,
    mahadasha: currentMD,
    antardasha: currentAD,
    antardashaEndDate: adEnd.toISOString().split("T")[0]
  };
}
