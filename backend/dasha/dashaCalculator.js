// backend/dasha/dashaCalculator.js
// Accurate Vimshottari Dasha (Node-compatible, NO julday)
console.log("🔥 NEW DASHACALCULATOR LOADED – VERSION 2025-01-LOCKED");
import swisseph from "swisseph";

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

const NAKSHATRA_LORDS = [
  "Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury",
  "Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury",
  "Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury"
];

/* ================= Helpers ================= */

// Julian Day calculation (astronomy standard)
function toJulianDay(date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day =
    date.getUTCDate() +
    date.getUTCHours() / 24 +
    date.getUTCMinutes() / 1440 +
    date.getUTCSeconds() / 86400;

  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }

  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);

  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    day +
    B -
    1524.5
  );
}

function addYears(date, years) {
  return new Date(date.getTime() + years * 365.2422 * 24 * 3600 * 1000);
}

/* ================= MAIN FUNCTION ================= */

export function calculateCurrentDasha(dob, tob) {
  const now = new Date();

  const birthDate = new Date(`${dob}T${tob}:00+05:30`);
  const jd = toJulianDay(birthDate);

  // Moon longitude (SIDEREAL – Lahiri)
  const moon = swisseph.calc_ut(
    jd,
    swisseph.SE_MOON,
    swisseph.SEFLG_SIDEREAL
  );

  if (moon.error) throw new Error(moon.error);

  const moonLon = moon.longitude % 360;

  // Nakshatra
  const nakSize = 360 / 27;
  const nakIndex = Math.floor(moonLon / nakSize);
  const nakLord = NAKSHATRA_LORDS[nakIndex];

  const nakProgress = (moonLon % nakSize) / nakSize;

  // Balance Mahadasha at birth
  const mdTotalYears = DASHA_YEARS[nakLord];
  const mdBalanceYears = mdTotalYears * (1 - nakProgress);

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

  // Antardasha
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

  return {
    system: "Vimshottari",
    ayanamsa: "Lahiri",
    mahadasha: currentMD,
    antardasha: currentAD,
    antardashaEndDate: adEnd.toISOString().split("T")[0]
  };
}
