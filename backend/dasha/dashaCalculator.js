// backend/dasha/dashaCalculator.js
import swe from "swisseph";

// Vimshottari dasha order
const DASHA_ORDER = [
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury"
];

// Vimshottari years
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

export function calculateCurrentDasha(dob, tob) {
  // 1️⃣ Parse date & time
  const [y, m, d] = dob.split("-").map(Number);
  const [hh, mm] = tob.split(":").map(Number);

  // 2️⃣ Julian Day
  const jd = swe.swe_julday(
    y,
    m,
    d,
    hh + mm / 60,
    swe.SE_GREG_CAL
  );

  // 3️⃣ Moon longitude
  const moon = swe.swe_calc_ut(
    jd,
    swe.SE_MOON,
    swe.SEFLG_SWIEPH
  );

  const moonLon = moon.longitude;

  // 4️⃣ Nakshatra
  const NAK_LEN = 13 + 1 / 3;
  const nakIndex = Math.floor(moonLon / NAK_LEN);
  const nakFrac = (moonLon % NAK_LEN) / NAK_LEN;

  // 5️⃣ Mahadasha
  const mdIndex = nakIndex % 9;
  const mahadasha = DASHA_ORDER[mdIndex];
  const mdYears = DASHA_YEARS[mahadasha];

  // 6️⃣ Antardasha
  const adSequence = [];
  for (let i = 0; i < 9; i++) {
    adSequence.push(DASHA_ORDER[(mdIndex + i) % 9]);
  }

  const adDurations = adSequence.map(
    (d) => (DASHA_YEARS[d] * mdYears) / 120
  );

  let elapsed = nakFrac * mdYears;
  let antardasha = adSequence[0];
  let remainingYears = adDurations[0];

  for (let i = 0; i < adSequence.length; i++) {
    if (elapsed <= adDurations[i]) {
      antardasha = adSequence[i];
      remainingYears = adDurations[i] - elapsed;
      break;
    }
    elapsed -= adDurations[i];
  }

  // 7️⃣ Antardasha end date
  const endDate = new Date(dob);
  endDate.setDate(
    endDate.getDate() + Math.round(remainingYears * 365.25)
  );

  return {
    dob,
    tob,
    place: "Delhi",
    mahadasha,
    antardasha,
    antardasha_end_date: endDate
      .toISOString()
      .split("T")[0]
  };
}
