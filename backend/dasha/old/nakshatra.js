const nakshatraLords = [
  "Ketu", "Shukra", "Surya", "Chandra", "Mangal",
  "Rahu", "Guru", "Shani", "Budh"
];

const mahadashaYears = {
  Ketu: 7,
  Shukra: 20,
  Surya: 6,
  Chandra: 10,
  Mangal: 7,
  Rahu: 18,
  Guru: 16,
  Shani: 19,
  Budh: 17
};

function getNakshatra(moonLongitude) {
  const nakDeg = 13 + 20 / 60; // 13.3333
  const index = Math.floor(moonLongitude / nakDeg);
  const lord = nakshatraLords[index % 9];
  return { index, lord };
}

module.exports = {
  getNakshatra,
  mahadashaYears,
  nakshatraLords
};
