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
      <div id="events-container"></div>
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

      function startCountdown(eventUtc, container) {
        const label = document.createElement('p');
        const countdown = document.createElement('p');
        countdown.style.fontWeight = 'bold';
        container.appendChild(label);
        container.appendChild(countdown);

        label.textContent = 'Starts at ' + formatter.format(eventUtc) + ' (' + tz + ')';

        function tick() {
          const diff = eventUtc - new Date();
          if (diff <= 0) {
            countdown.textContent = 'Live!';
            return;
          }
          const s = Math.floor(diff / 1000);
          const d = Math.floor(s / 86400);
          const h = Math.floor((s % 86400) / 3600);
          const m = Math.floor((s % 3600) / 60);
          const sec = s % 60;
          countdown.textContent = d + 'd ' + h + 'h ' + m + 'm ' + sec + 's';
        }

        tick();
        setInterval(tick, 1000);
      }

      function getNextDateUTC(dayOfMonth, hourUTC) {
        const now = new Date();
        let event = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), dayOfMonth, hourUTC, 0, 0));
        if (now >= event) event.setUTCMonth(event.getUTCMonth() + 1);
        return event;
      }

      function getNextWeekdayUTC(targetDay, hourUTC) {
        const now = new Date();
        const event = new Date(now);
        event.setUTCHours(hourUTC, 0, 0, 0);
        let diff = (targetDay - event.getUTCDay() + 7) % 7;
        if (diff === 0 && now >= event) diff = 7;
        event.setUTCDate(event.getUTCDate() + diff);
        return event;
      }

      function getNextRaidUTC() {
        const start = new Date();
        start.setUTCHours(7, 0, 0, 0);
        let diff = (5 - start.getUTCDay() + 7) % 7;
        if (diff === 0 && new Date() >= start) diff = 7;
        start.setUTCDate(start.getUTCDate() + diff);
        const end = new Date(start);
        end.setUTCDate(end.getUTCDate() + 3);
        return { start, end };
      }

      const events = [
        { name: 'Clan Games', time: getNextDateUTC(22, 8) },
        { name: 'CWL', time: getNextDateUTC(1, 8) },
        { name: 'Trader Refresh', time: getNextWeekdayUTC(2, 8) }, // Tuesday
        { name: 'Raid Weekend', time: getNextRaidUTC().start, endTime: getNextRaidUTC().end }
      ];

      // Sort by closest upcoming
      events.sort((a, b) => a.time - b.time);

      const container = document.getElementById('events-container');
      events.forEach(e => {
        const header = document.createElement('h3');
        header.textContent = e.name;
        container.appendChild(header);

        startCountdown(e.time, container);

        if (e.endTime) {
          const endLabel = document.createElement('p');
          endLabel.textContent = 'Ends at ' + formatter.format(e.endTime) + ' (' + tz + ')';
          container.appendChild(endLabel);
        }

        const sep = document.createElement('hr');
        sep.style.margin = '15px 0';
        container.appendChild(sep);
      });
    </script>
  `;
}

module.exports = renderStatusPage;
