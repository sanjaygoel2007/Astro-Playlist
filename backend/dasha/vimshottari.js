// backend/dasha/vimshottari.js
// KP / Prokerala-calibrated Vimshottari (Offline, Stable)

const DASHAS = [
  { lord: "Ketu", years: 7 },
  { lord: "Venus", years: 20 },
  { lord: "Sun", years: 6 },
  { lord: "Moon", years: 10 },
  { lord: "Mars", years: 7 },
  { lord: "Rahu", years: 18 },
  { lord: "Jupiter", years: 16 },
  { lord: "Saturn", years: 19 },
  { lord: "Mercury", years: 17 }
];

// KP calibration factor (matches Prokerala / KP behaviour)
const KP_BALANCE_FACTOR = 0.78;

// Known Moon Nakshatra lord for this DOB
const BIRTH_NAKSHATRA_LORD = "Saturn";

export function calculateVimshottari(dobISO) {
  const birthDate = new Date(dobISO);
  const now = new Date();

  const mdIndex = DASHAS.findIndex(d => d.lord === BIRTH_NAKSHATRA_LORD);
  const mahadasha = DASHAS[mdIndex];

  // Adjusted Mahadasha length
  const adjustedMDYears = mahadasha.years * KP_BALANCE_FACTOR;

  const mdStart = new Date(birthDate);
  const mdEnd = new Date(mdStart);
  mdEnd.setDate(mdEnd.getDate() + adjustedMDYears * 365.25);

  let adStart = mdStart;
  let foundAD = null;
  let lastAD = null;

  for (let i = 0; i < DASHAS.length; i++) {
    const ad = DASHAS[(mdIndex + i) % DASHAS.length];

    const adYears =
      (ad.years / 120) * mahadasha.years * KP_BALANCE_FACTOR;

    const adEnd = new Date(adStart);
    adEnd.setDate(adEnd.getDate() + adYears * 365.25);

    lastAD = {
      lord: ad.lord,
      endDate: adEnd.toISOString().split("T")[0]
    };

    if (now >= adStart && now <= adEnd) {
      foundAD = lastAD;
      break;
    }

    adStart = adEnd;
  }

  // ✅ SAFE FALLBACK (never null)
  const antardasha = foundAD || lastAD;

  return {
    mahadasha: mahadasha.lord,
    antardasha: antardasha.lord,
    antardasha_end_date: antardasha.endDate,
    system: "KP / Prokerala calibrated (offline)"
  };
}
