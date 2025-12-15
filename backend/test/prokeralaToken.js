import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.get("/test-prokerala-token", async (req, res) => {
  try {
    if (!process.env.PROKERALA_CLIENT_ID || !process.env.PROKERALA_CLIENT_SECRET) {
      return res.status(500).json({
        success: false,
        error: "PROKERALA_CLIENT_ID or PROKERALA_CLIENT_SECRET missing"
      });
    }

    const response = await fetch("https://api.prokerala.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.PROKERALA_CLIENT_ID,
        client_secret: process.env.PROKERALA_CLIENT_SECRET
      })
    });

    const data = await response.json();

    return res.json({
      success: true,
      token_response: data
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;
