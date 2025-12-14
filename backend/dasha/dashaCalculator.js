// backend/dasha/dashaCalculator.js
import swe from "swisseph";
import { NAKSHATRAS } from "./nakshatra.js";
import { formatDate } from "./utils.js";

swe.set_ephe_path("./ephe"); // default path

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

function getMoonLongitude(date) {
  const jd = getJulianDay(date);
  const result = swe.calc_ut(jd, swe.MOON, swe.FLG_SWIEPH);
  return result.longitude;
}

export function calculateCurrentDasha(dobStr, tobStr) {
  const birthDate = new Date(`${dobStr}T${tobStr}:00+05:30`);
  const today = new Date();

  const moonLon = getMoonLongitude(birthDate);

  const nakIndex = Math.floor(moonLon / (360 / 27));
  const nakshatra = NAKSHATRAS[nakIndex];
  const mahadashaLord = nakshatra.lord;

  const nakPortion = (moonLon % (360 / 27)) / (360 / 27);
  const balanceYears =
    DASHA_YEARS[mahadashaLord] * (1 - nakPortion);

  let cursor = new Date(birthDate);
  cursor.setFullYear(cursor.getFullYear() + balanceYears);

  let mdIndex = DASHA_ORDER.indexOf(mahadashaLord);

  while (cursor < today) {
    mdIndex = (mdIndex + 1) % 9;
    cursor.setFullYear(
      cursor.getFullYear() + DASHA_YEARS[DASHA_ORDER[mdIndex]]
    );
  }

  const currentMahadasha = DASHA_ORDER[mdIndex];

  // Antardasha
  let adCursor = new Date(
    cursor.getFullYear() - DASHA_YEARS[currentMahadasha],
    cursor.getMonth(),
    cursor.getDate()
  );

  for (let ad of DASHA_ORDER) {
    const adYears =
      (DASHA_YEARS[ad] / 120) * DASHA_YEARS[currentMahadasha];
    const adEnd = new Date(adCursor);
    adEnd.setFullYear(adEnd.getFullYear() + adYears);

    if (today <= adEnd) {
      return {
        current_mahadasha: currentMahadasha,
        current_antardasha: ad,
        antardasha_end_date: formatDate(adEnd),
        nakshatra: nakshatra.name,
        moon_longitude: moonLon.toFixed(2)
      };
    }
    adCursor = adEnd;
  }

  return { error: "Dasha
