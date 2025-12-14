// backend/dasha/dashaCalculator.js

import { NAKSHATRAS } from "./nakshatra.js";
import { addYears, formatDate } from "./utils.js";

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

// Simple deterministic moon position (no API)
function pseudoMoonLongitude(dob) {
  const base = new Date("1900-01-01");
  const diffDays = (dob - base) / (1000 * 60 * 60 * 24);
  return (diffDays * 13.176) % 360;
}

export function calculateCurrentDasha(dobStr, tobStr) {
  const dob = new Date(`${dobStr}T${tobStr}:00`);
  const today = new Date();

  const moonLon = pseudoMoonLongitude(dob);
  const nakIndex = Math.floor(moonLon / (360 / 27));
  const nakshatra = NAKSHATRAS[nakIndex];

  let cursorDate = dob;
  let mahadasha = nakshatra.lord;

  const dashaOrder = Object.keys(DASHA_YEARS);
  let startIndex = dashaOrder.indexOf(mahadasha);

  for (let i = 0; i < dashaOrder.length; i++) {
    const md = dashaOrder[(startIndex + i) % dashaOrder.length];
    const mdYears = DASHA_YEARS[md];
    const mdEnd = addYears(cursorDate, mdYears);

    if (today <= mdEnd) {
      // Antardasha
      let adCursor = cursorDate;
      for (let ad of dashaOrder) {
        const adYears = (DASHA_YEARS[ad] / 120) * mdYears;
        const adEnd = addYears(adCursor, adYears);

        if (today <= adEnd) {
          return {
            current_mahadasha: md,
            current_antardasha: ad,
            antardasha_end_date: formatDate(adEnd),
            nakshatra: nakshatra.name
          };
        }
        adCursor = adEnd;
      }
    }
    cursorDate = mdEnd;
  }

  return { error: "Unable to calculate dasha" };
}
