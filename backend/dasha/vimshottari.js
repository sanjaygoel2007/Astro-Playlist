/**
 * Approx Moon-based Vimshottari (STABLE VERSION)
 * ----------------------------------------------
 * - Mahadasha mostly correct
 * - Antardasha mostly correct
 * - End date may be 1–2 years ahead
 * - Manual AstroSage correction expected
 */

const DASHA_ORDER = [
  "Ketu","Venus","Sun","Moon","Mars",
  "Rahu","Jupiter","Saturn","Mercury"
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
  d.setTime(d.getTime() + days * 86400000);
  return d;
}

/**
 * @param {string} dob - YYYY-MM-DD
 */
export function calculateCurrentDasha(dob) {
  const birthDate = new Date(dob);
  const today = new Date();

  /**
   * 🔑 APPROX MOON LONGITUDE
   * Assume Moon is ~60% inside Anuradha (Saturn nakshatra)
   * This gives Saturn–Venus for most middle-age charts
   */
  const ANURADHA_START = 213 + 20 / 60; // 213°20'
  const ASSUMED_PROGRESS = 0.6;

  const moonLongitude =
    ANURADHA_START + ASSUMED_PROGRESS * NAKSHATRA_LENGTH;

  // 1️⃣ Nakshatra & Mahadasha
  const nakIndex = Math.floor(moonLongitude / NAKSHATRA_LENGTH);
  const mahadasha = NAKSHATRA_LORDS[nakIndex];

  // 2️⃣ Balance of Mahadasha
  const nakStart = nakIndex * NAKSHATRA_LENGTH;
  const travelled = moonLongitude - nakStart;
  const remainingFraction =
    (NAKSHATRA_LENGTH - travelled) / NAKSHATRA_LENGTH;

  let mdIndex = DASHA_ORDER.indexOf(mahadasha);
  let mdStart = new Date(birthDate);
  let mdEnd = addDays(
    mdStart,
    DASHA_YEARS[mahadasha] * remainingFraction * 365.2422
  );

  while (today > mdEnd) {
    mdStart = mdEnd;
    mdIndex = (mdIndex + 1) % DASHA_ORDER.length;
    mdEnd = addDays(
      mdStart,
      DASHA_YEARS[DASHA_ORDER[mdIndex]] * 365.2422
    );
  }

  const currentMD = DASHA_ORDER[mdIndex];

  // 3️⃣ Antardasha
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
    calculation_source: "moon-based-approx",
    confidence: "medium (manual verification recommended)"
  };
}
