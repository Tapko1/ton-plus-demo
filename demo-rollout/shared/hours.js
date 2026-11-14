(() => {
  const badge = document.querySelector('#hours-badge');
  const schedule = document.querySelector('#schedule');
  if (!badge || !schedule?.querySelector('[data-days]')) return;
  const clock = new Intl.DateTimeFormat('en-GB', {
    timeZone: schedule.dataset.timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  function refreshHours() {
    const parts = Object.fromEntries(clock.formatToParts().map(({ type, value }) => [type, value]));
    const today = schedule.querySelector(`[data-days~="${parts.weekday}"]`);
    const { open, close } = today?.dataset ?? {};
    const now = `${parts.hour}:${parts.minute}`;
    const isOpen = open && now >= open && now < close;

    badge.dataset.state = isOpen ? 'open' : 'closed';
    if (isOpen) {
      badge.textContent = open === '00:00' && close === '24:00'
        ? 'Открыто круглосуточно'
        : `Открыто до ${close === '24:00' ? 'полуночи' : close}`;
    } else if (open && now < open) {
      badge.textContent = `Закрыто · откроется в ${open}`;
    } else {
      badge.textContent = 'Сейчас закрыто';
    }
  }

  refreshHours();
  setInterval(refreshHours, 30_000);
  document.addEventListener('visibilitychange', refreshHours);
})();
