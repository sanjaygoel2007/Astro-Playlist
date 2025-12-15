import { getVimshottariDasha } from "../src/prokeralaService.js";

export async function calculateCurrentDasha(dob, tob, lat, lon, tz = "Asia/Kolkata") {
  if (!lat || !lon) {
    throw new Error("Latitude and longitude required");
  }

  return await getVimshottariDasha({
    dob,
    tob,
    lat,
    lon,
    tz
  });
}
