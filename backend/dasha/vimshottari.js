/**
 * Offline Vimshottari Dasha Calculator
 * -----------------------------------
 * Auto-calculation ke liye use karein.
 * Manual AstroSage verification baad me DB se override ho sakta hai.
 */

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

const NAKSHATRA_LENGTH = 13 + 20 / 60; // 13°20'

function addDays(date, days) {
  const d = new Date(date);
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  return d;
}

/**
 * @param {string} dob - YYYY-MM-DD
 * @param {number} moonLongitude - sidereal (Lahiri), 0–360
 */
export function calculateCurrentDasha(dob, moonLongitude) {
  const birthDate = new Date(dob);
  const today = new Date();

  // 1️⃣ Nakshatra
  const nakIndex = Math.floor(moonLongitude / NAKSHATRA_LENGTH);
  const nakLord = NAKSHATRA_LORDS[nakIndex];

  // 2️⃣ Balance of Mahadasha at birth
  const nakStart = nakIndex * NAKSHATRA_LENGTH;
  const travelled = moonLongitude - nakStart;
  const remainingFraction =
    (NAKSHATRA_LENGTH - travelled) / NAKSHATRA_LENGTH;

  let mdIndex = DASHA_ORDER.indexOf(nakLord);
  let currentMD = nakLord;

  let mdYearsRemaining =
    DASHA_YEARS[nakLord] * remainingFraction;

  let mdStart = new Date(birthDate);
  let mdEnd = addDays(mdStart, mdYearsRemaining * 365.2422);

  // 3️⃣ Find current Mahadasha
  while (today > mdEnd) {
    mdStart = mdEnd;
    mdIndex = (mdIndex + 1) % DASHA_ORDER.length;
    currentMD = DASHA_ORDER[mdIndex];
    mdEnd = addDays(mdStart, DASHA_YEARS[currentMD] * 365.2422);
  }

  // 4️⃣ Antardasha
  let adStart = mdStart;
  let currentAD = null;
  let adEnd = null;

  for (let i = 0; i < DASHA_ORDER.length; i++) {
    const adLord = DASHA_ORDER[(mdIndex + i) % DASHA_ORDER.length];
    const adYears =
      (DASHA_YEARS[adLord] / 120) * DASHA_YEARS[currentMD];

    const adFinish = addDays(adStart, adYears * 365.2422);

    if (today >= adStart && today <= adFinish) {
      currentAD = adLord;
      adEnd = adFinish;
      break;
    }
    adStart = adFinish;
  }

  return {
    mahadasha: currentMD,
    antardasha: currentAD,
    antardasha_end_date: adEnd.toISOString().split("T")[0],
    calculation_source: "offline-vimshottari"
  };
}
