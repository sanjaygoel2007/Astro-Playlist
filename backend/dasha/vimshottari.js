/**
 * Stable Auto-Approx Vimshottari
 * Purpose: Default playlist assignment
 * Manual AstroSage verification expected
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

/**
 * AUTO MODE (NO Moon longitude guessing)
 * Default assumption:
 *   - Mahadasha = Saturn
 *   - Used only for default playlist
 */
export function calculateCurrentDasha(dob) {
  const today = new Date();

  // 🔒 LOCKED DEFAULT (stable)
  const currentMD = "Saturn";
  const mdIndex = DASHA_ORDER.indexOf(currentMD);

  // Saturn Mahadasha approx window
  const mdStart = new Date("2009-01-01"); // safe historical anchor
  const mdEnd = addDays(mdStart, DASHA_YEARS[currentMD] * 365.2422);

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
    calculation_source: "auto-default",
    confidence: "low (manual verification recommended)"
  };
}
