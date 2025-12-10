import express from 'express';
import { getCurrentDasha } from './src/astrologyService.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Simple health check
app.get('/', (req, res) => {
  res.send('Astro Playlist backend is running ✅');
});

// Test route: /test-dasha?dob=1990-05-10&tob=14:30
app.get('/test-dasha', async (req, res) => {
  try {
    const dob = req.query.dob || '1990-05-10';
    const tob = req.query.tob || '14:30';

    const result = await getCurrentDasha({ dob, tob });

    res.json({
      success: true,
      dob,
      tob,
      mahadasha: result.mahadasha,
      antardasha: result.antardasha,
      antardashaEnd: result.antardashaEnd,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
