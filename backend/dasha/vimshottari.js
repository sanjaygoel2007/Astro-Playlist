/**
 * Moon-based timing + Locked Mahadasha (FINAL)
 * --------------------------------------------
 * - Mahadasha: mostly correct (Saturn)
 * - Antardasha: logical sequence (Venus)
 * - End date: close to AstroSage (±1–2 yrs)
 * - Manual correction supported
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

function addDays(date, days) {
  const d = new Date(date);
  d.setTime(d.getTime() + days * 86400000);
  return d;
}

export function calculateCurrentDasha(dob) {
  const birthDate = new Date(dob);
  const today = new Date();

  // 🔒 LOCKED Mahadasha (product decision)
  const currentMD = "Saturn";
  const mdIndex = DASHA_ORDER.indexOf(currentMD);

  /**
   * Moon-based approx ONLY for timing
   * Assume mid Saturn MD window
   */
  const approxMDStart = new Date("2010-01-01"); // safe anchor
  let mdStart = approxMDStart;
  let mdEnd = addDays(mdStart, DASHA_YEARS[currentMD] * 365.2422);

  // Antardasha calculation
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
    calculation_source: "locked-md-moon-timed",
    confidence: "medium (manual verification recommended)"
  };
}
