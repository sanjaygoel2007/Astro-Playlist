// backend/dasha/dashaCalculator.js
import swe from "swisseph";
import { NAKSHATRAS } from "./nakshatra.js";
import { formatDate } from "./utils.js";

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

const DASHA_ORDER = [
  "Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury"
];

function getJulianDay(date) {
  return swe.julday(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours() + date.getUTCMinutes() / 60
  );
}

function addYears(date, years) {
  const ms = years * 365.2422 * 24 * 60 * 60 * 1000;
  return new Date(date.getTime() + ms);
}

function getMoonLongitude(date) {
  const jd = getJulianDay(date);
  const res = swe.calc_ut(jd, swe.MOON);
  return res[0]; // ✅ longitude
}

export function calculateCurrentDasha(dob, tob) {
  const birth = new Date(`${dob}T${tob}:00+05:30`);
  const today = new Date();

  const moonLon = getMoonLongitude(birth);

  const nakIndex = Math.floor(moonLon / (360 / 27));
  const nakshatra = NAKSHATRAS[nakIndex];

  const mahadashaLord = nakshatra.lord;

  const nakFrac = (moonLon % (360 / 27)) / (360 / 27);
  const balanceYears = DASHA_YEARS[mahadashaLord] * (1 - nakFrac);

  let mdStart = addYears(birth, balanceYears);
  let mdIndex = DASHA_ORDER.indexOf(mahadashaLord);

  while (mdStart < today) {
    mdIndex = (mdIndex + 1) % 9;
    mdStart = addYears(mdStart, DASHA_YEARS[DASHA_ORDER[mdIndex]]);
  }

  const currentMahadasha = DASHA_ORDER[mdIndex];
  let adStart = addYears(mdStart, -DASHA_YEARS[currentMahadasha]);

  for (let ad of DASHA_ORDER) {
    const adYears =
      (DASHA_YEARS[ad] / 120) * DASHA_YEARS[currentMahadasha];

    const adEnd = addYears(adStart, adYears);

    if (today <= adEnd) {
      return {
        current_mahadasha: currentMahadasha,
        current_antardasha: ad,
        antardasha_end_date: formatDate(adEnd),
        nakshatra: nakshatra.name,
        moon_longitude: moonLon.toFixed(2)
      };
    }

    adStart = adEnd;
  }

  return { error: "Dasha calculation failed" };
          }
