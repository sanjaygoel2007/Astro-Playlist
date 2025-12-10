// server.js
import express from "express";
import dotenv from "dotenv";
import { getCurrentDasha } from "./astrologyService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.send("Astro playlist backend is running ✅");
});

app.get("/test-dasha", async (req, res) => {
  try {
    const { dob, tob } = req.query;

    if (!dob || !tob) {
      return res
        .status(400)
        .json({ success: false, error: "Please pass dob and tob query params" });
    }

    const raw = await getCurrentDasha({ dob, tob });

    return res.json({
      success: true,
      dob,
      tob,
      raw, // अभी पूरा raw response भेज रहे हैं
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, error: err.message || "Unknown error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
