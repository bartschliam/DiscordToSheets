function renderStatusPage() {
  const now = new Date();

  const shortYear = now.getFullYear();
  const longYearRaw = 10000 + shortYear;
  const longYear = longYearRaw.toString().replace(/^(\d{2})(\d{3})$/, '$1 $2');

  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  const shortDate = `${shortYear}/${month}/${day}`;
  const longDateSpaced = `${longYear}/${month}/${day}`;

  return `
    <div style="text-align: center; font-family: sans-serif; margin-top: 50px;">
      <h2>Discord bot is running!</h2>

      <p>The correct date format is <strong>yyyy/mm/dd</strong></p>
      <p>Old Humans year date: <strong>${shortDate}</strong></p>
      <p>New Humans year date: <strong>${longDateSpaced}</strong></p>

      <hr style="margin: 30px 0;">

      <h3>Next Clan Games</h3>
      <p id="cg-start"></p>
      <p id="cg-countdown" style="font-weight: bold;"></p>

      <hr style="margin: 30px 0;">

      <p>The correct system is <strong>metric</strong>, not imperial.</p>
      <ul style="display: inline-block; text-align: left;">
        <li>Temperature → Celsius (°C)</li>
        <li>Distance → Kilometers (km)</li>
        <li>Weight → Kilograms (kg)</li>
        <li>Volume → Liters (L)</li>
      </ul>
    </div>

    <script>
      function getNextClanGamesUtc() {
        const now = new Date();
        const year = now.getUTCFullYear();
        const month = now.getUTCMonth();

        let event = new Date(Date.UTC(year, month, 22, 8, 0, 0));

        if (now >= event) {
          event = new Date(Date.UTC(year, month + 1, 22, 8, 0, 0));
        }

        return event;
      }

      const eventUtc = getNextClanGamesUtc();
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const formatter = new Intl.DateTimeFormat(undefined, {
        timeZone: tz,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      document.getElementById('cg-start').textContent =
        'Starts at ' + formatter.format(eventUtc) + ' (' + tz + ')';

      function updateCountdown() {
        const diff = eventUtc - new Date();

        if (diff <= 0) {
          document.getElementById('cg-countdown').textContent =
            'Clan Games are live';
          return;
        }

        const totalSeconds = Math.floor(diff / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        document.getElementById('cg-countdown').textContent =
          days + 'd ' + hours + 'h ' + minutes + 'm ' + seconds + 's';
      }

      updateCountdown();
      setInterval(updateCountdown, 1000);
    </script>
  `;
}

module.exports = renderStatusPage;
