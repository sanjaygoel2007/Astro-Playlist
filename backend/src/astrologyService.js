import fetch from "node-fetch";

export async function getDasha({ dob, tob }) {
  const apiKey = process.env.ASTRO_API_KEY;
  if (!apiKey) throw new Error("ASTRO_API_KEY missing");

  const url = "https://json.astrologyapi.com/v1/current_dasha";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + Buffer.from(apiKey + ":" + process.env.ASTRO_API_SECRET).toString("base64"),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      day: Number(dob.split("-")[2]),
      month: Number(dob.split("-")[1]),
      year: Number(dob.split("-")[0]),
      hour: Number(tob.split(":")[0]),
      min: Number(tob.split(":")[1]),
      lat: 28.7041,
      lon: 77.1025,
      tzone: 5.5
    })
  });

  if (!response.ok) throw new Error("API request failed");

  return response.json();
}
