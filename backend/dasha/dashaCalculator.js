const swe = require("swisseph");
const moment = require("moment");
const { getJulianDay } = require("./utils");
const {
  getNakshatra,
  mahadashaYears,
  nakshatraLords
} = require("./nakshatra");

// Swiss Ephemeris setup
swe.set_ephe_path(__dirname);

function calculateCurrentDasha(dob, tob) {
  // Delhi fixed
  const lat = 28.6139;
  const lon = 77.2090;

  const { year, month, day } = getJulianDay(dob, tob);

  const jd = swe.julday(
    year,
    month,
    day,
    swe.GREG_CAL
  );

  const moonPos = swe.calc_ut(jd, swe.MOON);
  const moonLongitude = moonPos.longitude;

  const { lord: startMahadasha } = getNakshatra(moonLongitude);

  // Balance Mahadasha
  const nakDeg = 13 + 20 / 60;
  const completedDeg = moonLongitude % nakDeg;
  const remainingDeg = nakDeg - completedDeg;

  const startYears = mahadashaYears[startMahadasha];
  const balanceYears =
    (remainingDeg / nakDeg) * startYears;

  let timeline = [];
  let currentDate = moment(dob);

  let startIndex = nakshatraLords.indexOf(startMahadasha);

  // Build 120-year dasha timeline
  for (let i = 0; i < nakshatraLords.length * 2; i++) {
    const lord = nakshatraLords[(startIndex + i) % 9];
    const years =
      i === 0 ? balanceYears : mahadashaYears[lord];

    const start = currentDate.clone();
    const end = currentDate.clone().add(years, "years");

    timeline.push({ lord, start, end });
    currentDate = end.clone();
  }

  const now = moment();

  const activeMahadasha = timeline.find(
    d => now.isBetween(d.start, d.end)
  );

  // Antardasha
  let antardashaStart = activeMahadasha.start.clone();

  for (let ad of nakshatraLords) {
    const adYears =
      (mahadashaYears[activeMahadasha.lord] *
        mahadashaYears[ad]) /
      120;

    const adEnd = antardashaStart
      .clone()
      .add(adYears, "years");

    if (now.isBetween(antardashaStart, adEnd)) {
      return {
        input: {
          dob,
          tob,
          place: "Delhi, India"
        },
        current_mahadasha: activeMahadasha.lord,
        current_antardasha: ad,
        antardasha_end_date: adEnd.format("YYYY-MM-DD")
      };
    }

    antardashaStart = adEnd.clone();
  }

  throw new Error("Dasha not found");
}

module.exports = { calculateCurrentDasha };
