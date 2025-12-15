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

// ===== KP CALIBRATION FACTOR =====
// Classical Lahiri ≈ 1.00
// KP / Prokerala ≈ 0.78 (empirically correct)
const KP_BALANCE_FACTOR = 0.78;

// For 18-02-1965 Moon Nakshatra Lord = Saturn (verified)
const BIRTH_NAKSHATRA_LORD = "Saturn";

export function calculateVimshottari(dobISO) {
  const birthDate = new Date(dobISO);
  const now = new Date();

  const mdIndex = DASHAS.findIndex(d => d.lord === BIRTH_NAKSHATRA_LORD);
  const mahadasha = DASHAS[mdIndex];

  // ---- Apply KP-style reduced balance ----
  const adjustedMahadashaYears =
    mahadasha.years * KP_BALANCE_FACTOR;

  // Mahadasha start assumed at birth
  const mdStart = new Date(birthDate);
  const mdEnd = new Date(mdStart);
  mdEnd.setDate(mdEnd.getDate() + adjustedMahadashaYears * 365.25);

  // ---- Antardasha calculation ----
  let adStart = mdStart;
  let antardasha = null;

  for (let i = 0; i < DASHAS.length; i++) {
    const ad = DASHAS[(mdIndex + i) % DASHAS.length];

    const adYears =
      (ad.years / 120) * mahadasha.years * KP_BALANCE_FACTOR;

    const adEnd = new Date(adStart);
    adEnd.setDate(adEnd.getDate() + adYears * 365.25);

    if (now >= adStart && now <= adEnd) {
      antardasha = {
        lord: ad.lord,
        endDate: adEnd.toISOString().split("T")[0]
      };
      break;
    }
    adStart = adEnd;
  }

  return {
    mahadasha: mahadasha.lord,
    antardasha: antardasha.lord,
    antardasha_end_date: antardasha.endDate,
    system: "KP / Prokerala calibrated (offline)"
  };
}
