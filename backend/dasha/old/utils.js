const moment = require("moment-timezone");

function getJulianDay(dob, tob) {
  const dateTime = moment.tz(
    `${dob} ${tob}`,
    "YYYY-MM-DD HH:mm",
    "Asia/Kolkata"
  );

  const year = dateTime.year();
  const month = dateTime.month() + 1;
  const day =
    dateTime.date() +
    (dateTime.hour() +
      dateTime.minute() / 60) /
      24;

  return { year, month, day };
}

module.exports = { getJulianDay };
