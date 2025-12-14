// backend/dasha/dashaCalculator.js
import swe from "swisseph";

/* ================== CONSTANTS ================== */

const NAKSHATRA_LORDS = [
  "Ketu", "Shukra", "Surya", "Chandra", "Mangal",
  "Rahu", "Guru", "Shani", "Budh"
];

const MAHADASHA_YEARS = {
  Ketu: 7,
  Shukra: 20,
  Surya: 6,
  Chandra: 10,
  Mangal: 7,
  Rahu: 18,
  Guru: 16,
  Shani: 19,
  Budh: 17
};

const TOTAL_DASHA_YEARS = 120;
const NAKSHATRA_SIZE = 13 + 1 / 3; // 13.333333°

/* ================== HELPERS ================== */

// ✅ Julian Day (Node-safe, NO swe.julday)
function getJulianDay(date) {
  const y = date.getUTCFullYear();
  let m = date.getUTCMonth() + 1;
  const d =
    date.getUTCDate() +
    (date.getUTCHours() + date.getUTCMinutes() / 60) / 24;

  let Y = y;
  let M = m;

  if (M <= 2) {
    Y -= 1;
    M += 12;
  }

  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);

  return (
    Math.floor(365.25 * (Y + 4716)) +
    Math.floor(30.6001 * (M + 1)) +
    d +
    B -
    1524.5
  );
}

// 🌙 Moon longitude
function getMoonLongitude(date) {
  const jd = getJulianDay(date);
  const res = swe.calc_ut(jd, swe.MOON);
  return res[0]; // longitude
}

/* ================== MAIN LOGIC ================== */

export function calculateCurrentDasha(dob, tob) {
  // Fixed place: Delhi
  const date = new Date(`${dob}T${tob}:00Z`);

  const moonLon = getMoonLongitude(date);
  const nakIndex = Math.floor(moonLon / NAKSHATRA_SIZE);
  const nakLord = NAKSHATRA_LORDS[nakIndex % 9];

  // Remaining Mahadasha at birth
  const nakStart = nakIndex * NAKSHATRA_SIZE;
  const progressed = moonLon - nakStart;
  const balanceRatio = 1 - progressed / NAKSHATRA_SIZE;

  const mahadashaYearsLeft =
    MAHADASHA_YEARS[nakLord] * balanceRatio;

  const birthTime = date.getTime();
  const now = Date.now();
  const elapsedYears =
    (now - birthTime) / (1000 * 60 * 60 * 24 * 365.25);

  let currentMahadasha = nakLord;
  let yearsPassed = MAHADASHA_YEARS[nakLord] - mahadashaYearsLeft;

  let orderIndex = NAKSHATRA_LORDS.indexOf(nakLord);

  while (elapsedYears > yearsPassed + MAHADASHA_YEARS[currentMahadasha]) {
    yearsPassed += MAHADASHA_YEARS[currentMahadasha];
    orderIndex = (orderIndex + 1) % 9;
    currentMahadasha = NAKSHATRA_LORDS[orderIndex];
  }

  // -------- Antardasha --------
  const mdYears = MAHADASHA_YEARS[currentMahadasha];
  const mdElapsed = elapsedYears - yearsPassed;

  let adIndex = orderIndex;
  let adElapsed = 0;
  let currentAntardasha = currentMahadasha;
  let adDurationYears = 0;

  for (let i = 0; i < 9; i++) {
    const lord = NAKSHATRA_LORDS[(orderIndex + i) % 9];
    const dur = (mdYears * MAHADASHA_YEARS[lord]) / TOTAL_DASHA_YEARS;

    if (mdElapsed <= adElapsed + dur) {
      currentAntardasha = lord;
      adDurationYears = dur;
      break;
    }
    adElapsed += dur;
  }

  const adEndDate = new Date(
    now + (adElapsed + adDurationYears - mdElapsed) * 365.25 * 24 * 60 * 60 * 1000
  );

  return {
    place_of_birth: "Delhi",
    current_mahadasha: currentMahadasha,
    current_antardasha: currentAntardasha,
    antardasha_end_date: adEndDate.toISOString().split("T")[0]
  };
}
