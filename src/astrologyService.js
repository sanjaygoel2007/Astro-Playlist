import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

// use env variables
const LATITUDE = process.env.LATITUDE;
const LONGITUDE = process.env.LONGITUDE;
const TIMEZONE = process.env.TIMEZONE;
const API_KEY = process.env.ASTRO_API_KEY;

export async function getCurrentDasha() {
  try {
    const url =
      "https://json.freeastrologyapi.com/vimsottari/maha-dasas-and-antar-dasas";

    const body = {
      year: 1990,
      month: 5,
      date: 10,
      hours: 8,
      minutes: 30,
      seconds: 0,
      latitude: Number(LATITUDE),
      longitude: Number(LONGITUDE),
      timezone: Number(TIMEZONE),
      config: {
        observation_point: "topocentric",
        ayanamsha: "lahiri",
      }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    return result;

  } catch (err) {
    console.error("Error fetching dasha:", err);
    return { success: false, error: err.message };
  }
}
