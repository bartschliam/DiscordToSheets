const express = require('express');

function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.get('/', (req, res) => {
    const now = new Date();

    const shortYear = now.getFullYear(); // 2025
    const longYearRaw = 10000 + shortYear; // 12025
    const longYear = longYearRaw.toString().replace(/^(\d{2})(\d{3})$/, '$1 $2'); // 12 025

    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    const shortDate = `${shortYear}/${month}/${day}`;
    const longDate = `${longYear.replace(' ', '')}/${month}/${day}`; // 12025/mm/dd
    const longDateSpaced = `${longYear}/${month}/${day}`; // 12 025/mm/dd

    res.send(`
      <div style="text-align: center; font-family: sans-serif; margin-top: 50px;">
        <h2>Discord bot is running!</h2>
        <p>The correct date format is <strong>yyyy/mm/dd</strong></p>
        <p>Old Humans year date: <strong>${shortDate}</strong></p>
        <p>New Humans year date: <strong>${longDateSpaced}</strong></p>
        <p>The correct system is <strong>metric</strong>, not imperial.</p>
        <p>That means:</p>
        <ul style="display: inline-block; text-align: left;">
          <li>Temperature → Celsius (°C)</li>
          <li>Distance → Kilometers (km)</li>
          <li>Weight → Kilograms (kg)</li>
          <li>Volume → Liters (L)</li>
        </ul>
      </div>
    `);
  });

  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  console.log("Node.js version:", process.version);
}

module.exports = startServer;