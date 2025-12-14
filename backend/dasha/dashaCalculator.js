// backend/dasha/dashaCalculator.js
import swe from "swisseph";

/*
  Vimshottari order
*/
const DASHA_ORDER = [
  "Ketu",
  "Shukra",
  "Surya",
  "Chandra",
  "Mangal",
  "Rahu",
  "Guru",
  "Shani",
  "Budh"
];

const DASHA_YEARS = {
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

/*
  Nakshatra lords (27)
*/
const NAKSHATRA_LORDS = [
  "Ketu","Shukra","Surya","Chandra","Mangal","Rahu","Guru","Shani","Budh",
  "Ketu","Shukra","Surya","Chandra","Mangal","Rahu","Guru","Shani","Budh",
  "Ketu","Shukra","Surya","Chandra","Mangal","Rahu","Guru","Shani","Budh"
];

/*
  Julian Day (Node-safe)
*/
function getJulianDay(date) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
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

/*
  Moon longitude
*/
function getMoonLongitude(date) {
  const jd = getJulianDay(date);
  const res = swe.calc_ut(jd, swe.MOON);
  return res[0]; // degrees
}

/*
  MAIN FUNCTION
*/
export function calculateCurrentDasha(dob, tob) {
  // Delhi fixed
  const [hh, mm] = tob.split(":").map(Number);
  const birthDate = new Date(`${dob}T${tob}:00+05:30`);

  const moonLon = getMoonLongitude(birthDate);
  const nakshatraIndex = Math.floor(moonLon / (360 / 27));
  const mahadashaLord = NAKSHATRA_LORDS[nakshatraIndex];

  const nakshatraStart = nakshatraIndex * (360 / 27);
  const elapsedDeg = moonLon - nakshatraStart;
  const fractionPassed = elapsedDeg / (360 / 27);

  const totalYears = DASHA_YEARS[mahadashaLord];
  const remainingYears = totalYears * (1 - fractionPassed);

  const mahadashaStart = new Date(birthDate);
  mahadashaStart.setFullYear(
    mahadashaStart.getFullYear() - (totalYears - remainingYears)
  );

  const now = new Date();

  let currentMahadasha = mahadashaLord;
  let currentAntardasha = null;
  let antardashaEndDate = null;

  const antardashaOrder = DASHA_ORDER.slice(
    DASHA_ORDER.indexOf(currentMahadasha)
  ).concat(
    DASHA_ORDER.slice(0, DASHA_ORDER.indexOf(currentMahadasha))
  );

  let adStart = new Date(mahadashaStart);

  for (const ad of antardashaOrder) {
    const adYears =
      (DASHA_YEARS[currentMahadasha] * DASHA_YEARS[ad]) / 120;

    const adEnd = new Date(adStart);
    adEnd.setFullYear(adEnd.getFullYear() + adYears);

    if (now >= adStart && now < adEnd) {
      currentAntardasha = ad;
      antardashaEndDate = adEnd;
      break;
    }

    adStart = adEnd;
  }

  return {
    place: "Delhi",
    moon_longitude: moonLon.toFixed(2),
    nakshatra: nakshatraIndex + 1,
    mahadasha: currentMahadasha,
    antardasha: currentAntardasha,
    antardasha_end_date: antardashaEndDate
      ? antardashaEndDate.toISOString().split("T")[0]
      : null
  };
}
