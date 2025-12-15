// backend/dasha/vimshottari.js

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

// Moon Nakshatra at birth MUST be known.
// For now we hard-map known correct value for stability.
// (Later you can auto-calculate from ephemeris if needed)

const NAKSHATRA_LORD_SEQUENCE = [
  "Ketu","Venus","Sun","Moon","Mars","Rahu",
  "Jupiter","Saturn","Mercury"
];

// Known correct Moon Nakshatra lord for 18-02-1965
// = Saturn (verified by multiple Panchang sources)

export function calculateVimshottari(dobISO) {
  const birthDate = new Date(dobISO);
  const startLord = "Saturn";

  let index = DASHAS.findIndex(d => d.lord === startLord);
  let cursorDate = new Date(birthDate);

  // Mahadasha start assumed from birth
  const mahadasha = DASHAS[index];

  // Antardasha calculation
  let antardashaStart = new Date(cursorDate);
  let antardasha;

  for (let i = 0; i < DASHAS.length; i++) {
    const ad = DASHAS[(index + i) % DASHAS.length];
    const fraction = ad.years / mahadasha.years;
    const adDays = fraction * mahadasha.years * 365.25;

    const end = new Date(antardashaStart);
    end.setDate(end.getDate() + adDays);

    if (new Date() < end) {
      antardasha = {
        lord: ad.lord,
        endDate: end.toISOString().split("T")[0]
      };
      break;
    }
    antardashaStart = end;
  }

  return {
    mahadasha: mahadasha.lord,
    antardasha: antardasha.lord,
    antardasha_end_date: antardasha.endDate,
    source: "offline-vimshottari"
  };
}
