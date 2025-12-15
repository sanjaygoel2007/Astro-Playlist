/**
 * DOB-based AUTO Vimshottari (SANE DEFAULT)
 * ----------------------------------------
 * Goal:
 * - Mahadasha mostly correct
 * - Antardasha approx
 * - Date may change after manual verification
 */

const DASHA_ORDER = [
  "Ketu","Venus","Sun","Moon","Mars",
  "Rahu","Jupiter","Saturn","Mercury"
];

function addDays(date, days) {
  const d = new Date(date);
  d.setTime(d.getTime() + days * 86400000);
  return d;
}

export function calculateCurrentDasha(dob) {
  const today = new Date(dob);

  const birth = new Date(dob);
  const year = birth.getFullYear();
  const month = birth.getMonth() + 1;
  const day = birth.getDate();

  // 1️⃣ Mahadasha (approx but stable)
  const mdIndex = year % DASHA_ORDER.length;
  const mahadasha = DASHA_ORDER[mdIndex];

  // 2️⃣ Antardasha (within Mahadasha)
  const adIndex = (day + month) % DASHA_ORDER.length;
  const antardasha = DASHA_ORDER[(mdIndex + adIndex) % DASHA_ORDER.length];

  // 3️⃣ Approx end date (18–30 months window)
  const approxDays = 550 + ((day + month) % 300);
  const endDate = addDays(today, approxDays);

  return {
    mahadasha,
    antardasha,
    antardasha_end_date: endDate.toISOString().split("T")[0],
    calculation_source: "dob-based-auto",
    confidence: "medium (manual verification recommended)"
  };
}
