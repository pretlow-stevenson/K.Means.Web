(() => {
  const visual = document.querySelector('.hero-visual[data-holiday-until]');
  if (!visual) return;

  // The explicit offset makes January 2 midnight Eastern the same instant worldwide.
  const deadline = Date.parse(visual.dataset.holidayUntil);
  const listeners = new AbortController();
  let timer = 0;
  let ended = false;

  const check = () => {
    clearTimeout(timer);
    if (ended) return;
    const remaining = deadline - Date.now();
    if (!Number.isFinite(remaining) || remaining <= 0) {
      ended = true;
      visual.dataset.holiday = 'inactive';
      visual.querySelectorAll('.holiday-ornaments, .hero-snow, .snow-toggle').forEach((element) => {
        if (element.contains(document.activeElement)) document.activeElement.blur();
        element.hidden = true;
      });
      visual.dispatchEvent(new CustomEvent('holiday:end'));
      listeners.abort();
      return;
    }
    visual.dataset.holiday = 'active';
    // Bound the timer to avoid the browser's 32-bit timeout limit for distant dates.
    timer = setTimeout(check, Math.min(remaining, 24 * 60 * 60 * 1000));
  };

  document.addEventListener('visibilitychange', check, { signal: listeners.signal });
  window.addEventListener('pageshow', check, { signal: listeners.signal });
  window.addEventListener('focus', check, { signal: listeners.signal });
  check();
})();
