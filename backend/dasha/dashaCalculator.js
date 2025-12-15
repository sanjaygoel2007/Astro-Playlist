import fetch from "node-fetch";

/**
 * Calculate current Vimshottari dasha using Prokerala API
 */
export async function calculateCurrentDasha(dob, tob, lat, lon) {
  if (!process.env.ASTRO_API_KEY) {
    throw new Error("ASTRO_API_KEY missing");
  }

  const datetime = `${dob}T${tob}:00+05:30`;

  const url = "https://api.prokerala.com/v2/astrology/vimshottari-dasha";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.ASTRO_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      datetime,
      latitude: lat,
      longitude: lon,
      ayanamsa: "lahiri"
    })
  });

  const json = await response.json();

  const current = json?.data?.dasha?.current;

  if (!current) {
    throw new Error("Invalid response from Prokerala API");
  }

  return {
    success: true,
    source: "api",
    mahadasha: current.mahadasha,
    antardasha: current.antardasha,
    antardasha_end_date: current.antardasha_end_date
  };
}
