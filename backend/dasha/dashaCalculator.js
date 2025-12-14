// backend/dasha/dashaCalculator.js
import swe from "swisseph";

/*
  FIX: swisseph CommonJS hai
  ESM me functions swe.xxx se aate hain
*/

swe.set_ephe_path(""); // default ephemeris

// Vimshottari order
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

// Years of each Mahadasha
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
  // ---------------------------
  // 1️⃣ DATE → JULIAN DAY
  // ---------------------------
  const [y, m, d] = dob.split("-").map(Number);
  const [hh, mm] = tob.split(":").map(Number);

  const jd =
    swe.swe_julday(y, m, d, hh + mm / 60, swe.SE_GREG_CAL);

  // ---------------------------
  // 2️⃣ MOON POSITION
  // ---------------------------
  const moon = swe.swe_calc_ut(jd, swe.SE_MOON, swe.SEFLG_SWIEPH);

  const moonLon = moon.longitude; // degrees

  // ---------------------------
  // 3️⃣ NAKSHATRA
  // ---------------------------
  const nakshatraIndex = Math.floor(moonLon / (13 + 1 / 3));
  const nakshatraFraction =
    (moonLon % (13 + 1 / 3)) / (13 + 1 / 3);

  // ---------------------------
  // 4️⃣ MAHADASHA
  // ---------------------------
  const mahadashaIndex = nakshatraIndex % 9;
  const mahadasha = DASHA_ORDER[mahadashaIndex];

  const mdYears = DASHA_YEARS[mahadasha];
  const remainingMDYears = (1 - nakshatraFraction) * mdYears;

  // ---------------------------
  // 5️⃣ ANTARDASHA
  // ---------------------------
  const adOrder = [];
  for (let i = 0; i < 9; i++) {
    adOrder.push(DASHA_ORDER[(mahadashaIndex + i) % 9]);
  }

  const adYears = adOrder.map(
    (d) => (DASHA_YEARS[d] * mdYears) / 120
  );

  let elapsed = (1 - nakshatraFraction) * mdYears;
  let antardasha = adOrder[0];
  let adEndYears = 0;

  for (let i = 0; i < adOrder.length; i++) {
    if (elapsed <= adYears[i]) {
      antardasha = adOrder[i];
      adEndYears = adYears[i] - elapsed;
      break;
    }
    elapsed -= adYears[i];
  }

  // ---------------------------
  // 6️⃣ END DATE
  // ---------------------------
  const endDate = new Date(dob);
  endDate.setFullYear(
    endDate.getFullYear() + Math.ceil(adEndYears)
  );

  return {
    place: "Delhi",
    dob,
    tob,
    mahadasha,
    antardasha,
    antardasha_end_date: endDate.toISOString().split("T")[0]
  };
}
