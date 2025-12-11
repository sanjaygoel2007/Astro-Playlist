import { getCurrentDasha } from './src/astrologyService.js';

async function main() {
  try {
    // Yahan apna DOB/TOB daal sakte ho
    const dob = '1990-05-10'; // YYYY-MM-DD
    const tob = '14:30';      // HH:MM (24-hour)

    const result = await getCurrentDasha({ dob, tob });

    console.log('Current Mahadasha  :', result.mahadasha);
    console.log('Current Antardasha :', result.antardasha);
    console.log('Antardasha ends on :', result.antardashaEnd);

  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
