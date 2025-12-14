// backend/src/astrologyService.js
import fetch from "node-fetch";

export async function getDasha({ dob, tob }) {
  const apiKey = process.env.ASTRO_API_KEY;
  const apiSecret = process.env.ASTRO_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("ASTRO_API_KEY or ASTRO_API_SECRET missing in env");
  }

  const url = "https://json.astrologyapi.com/v1/current_dasha";

  const [year, month, day] = dob.split("-").map(Number);
  const [hour, min] = tob.split(":").map(Number);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization":
        "Basic " +
        Buffer.from(`${apiKey}:${apiSecret}`).toString("base64"),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      day,
      month,
      year,
      hour,
      min,
      lat: 28.7041,   // Delhi
      lon: 77.1025,   // Delhi
      tzone: 5.5
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Astrology API failed: ${response.status} ${text}`);
  }

  return await response.json();
}
