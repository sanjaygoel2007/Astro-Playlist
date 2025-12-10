import express from "express";
import dotenv from "dotenv";
import { getDasha } from "./src/astrologyService.js";

dotenv.config();
const app = express();
app.use(express.json());

// Root check
app.get("/", (req, res) => {
  res.send("Astro Playlist backend is running ⚡");
});

// MAIN ROUTE → /current-dasha
app.get("/current-dasha", async (req, res) => {
  try {
    const { dob, tob } = req.query;

    if (!dob || !tob) {
      return res.status(400).json({ success: false, error: "dob or tob missing" });
    }

    const result = await getDasha(dob, tob);
    return res.json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
