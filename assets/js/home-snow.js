(() => {
  const visual = document.querySelector('.hero-visual');
  const snow = visual?.querySelector('.hero-snow');
  const toggle = visual?.querySelector('.snow-toggle');
  if (!visual || visual.dataset.holiday !== 'active' || !snow || !toggle) return;

  const listeners = new AbortController();
  const on = (target, type, handler, options = {}) => target.addEventListener(type, handler, { ...options, signal: listeners.signal });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pauseKey = 'kmeans-snow-paused';
  let paused = false;
  let expired = false;
  let resizeObserver = null;
  let visibilityObserver = null;
  let inView = !('IntersectionObserver' in window);
  try {
    paused = sessionStorage.getItem(pauseKey) === 'true';
  } catch {
    // Pausing still works when browser storage is unavailable.
  }

  // Fixed, staggered paths keep the small snowfall evenly spread and loop quietly.
  for (let index = 0; index < 24; index += 1) {
    const flake = document.createElement('span');
    flake.className = 'snowflake';
    flake.style.setProperty('--snow-x', `${8 + (index * 37 % 84)}%`);
    flake.style.setProperty('--snow-size', `${12 + (index % 4) * 2}px`);
    flake.style.setProperty('--snow-angle', `${index * 23 % 60}deg`);
    flake.style.setProperty('--snow-duration', `${12 + (index % 5) * 1.7}s`);
    flake.style.setProperty('--snow-delay', `${-((index * 4.7) % 19)}s`);
    flake.style.setProperty('--snow-drift', `${(index % 2 ? 1 : -1) * (9 + (index % 4) * 6)}px`);
    flake.style.setProperty('--snow-opacity', `${0.6 + (index % 4) * 0.1}`);
    const crystal = document.createElement('span');
    crystal.className = 'snow-crystal';
    flake.append(crystal);
    snow.append(flake);
  }

  const running = () => !expired && !paused && !reducedMotion.matches && inView && !document.hidden;

  const measure = () => {
    if (expired) return;
    snow.style.setProperty('--snow-fall', `${snow.clientHeight + 12}px`);
  };

  const update = () => {
    if (expired) return;
    snow.hidden = reducedMotion.matches;
    toggle.hidden = reducedMotion.matches;
    snow.classList.toggle('is-running', running());
    toggle.textContent = paused ? 'resume snow' : 'pause snow';
    toggle.setAttribute('aria-label', paused ? 'Resume snowfall' : 'Pause snowfall');
    measure();
  };

  on(toggle, 'click', () => {
    paused = !paused;
    try {
      sessionStorage.setItem(pauseKey, String(paused));
    } catch {
      // The current page retains the visitor's choice without persistent storage.
    }
    update();
  });
  on(reducedMotion, 'change', update);
  on(document, 'visibilitychange', update);
  on(window, 'pagehide', () => {
    snow.classList.remove('is-running');
  });
  on(window, 'pageshow', update);
  if ('ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(visual);
  } else {
    on(window, 'resize', measure, { passive: true });
  }
  if ('IntersectionObserver' in window) {
    visibilityObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    });
    visibilityObserver.observe(visual);
  }
  on(visual, 'holiday:end', () => {
    expired = true;
    snow.classList.remove('is-running');
    snow.hidden = true;
    toggle.hidden = true;
    resizeObserver?.disconnect();
    visibilityObserver?.disconnect();
    listeners.abort();
    snow.replaceChildren();
  }, { once: true });
  update();
})();
