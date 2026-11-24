(() => {
  const visual = document.querySelector('.hero-visual');
  const snow = visual?.querySelector('.hero-snow');
  const toggle = visual?.querySelector('.snow-toggle');
  if (!visual || visual.dataset.holiday !== 'active' || !snow || !toggle) return;

  const listeners = new AbortController();
  const on = (target, type, handler, options = {}) => target.addEventListener(type, handler, { ...options, signal: listeners.signal });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pauseKey = 'kmeans-snow-paused';
  const flakes = [];
  const gusts = new Map();
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
    flake.style.setProperty('--snow-size', `${2.5 + (index % 4) * 0.75}px`);
    flake.style.setProperty('--snow-duration', `${12 + (index % 5) * 1.7}s`);
    flake.style.setProperty('--snow-delay', `${-((index * 4.7) % 19)}s`);
    flake.style.setProperty('--snow-drift', `${(index % 2 ? 1 : -1) * (9 + (index % 4) * 6)}px`);
    flake.style.setProperty('--snow-opacity', `${0.6 + (index % 4) * 0.1}`);
    const grain = document.createElement('span');
    grain.className = 'snow-grain';
    flake.append(grain);
    snow.append(flake);
    flakes.push({ flake, grain });
  }

  const cancelGusts = () => {
    gusts.forEach((animation) => animation.cancel());
    gusts.clear();
  };

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
    if (!running()) cancelGusts();
    toggle.textContent = paused ? 'resume snow' : 'pause snow';
    toggle.setAttribute('aria-label', paused ? 'Resume snowfall' : 'Pause snowfall');
    measure();
  };

  on(visual, 'holiday:gust', (event) => {
    const { x, y, strength } = event.detail || {};
    if (!running() || !Element.prototype.animate || ![x, y, strength].every(Number.isFinite)) return;
    const radius = Math.max(85, Math.min(150, visual.clientWidth * 0.65));
    const nearby = flakes.map(({ flake, grain }) => {
      const rect = flake.getBoundingClientRect();
      return { grain, distance: Math.hypot(rect.left + rect.width / 2 - x, rect.top + rect.height / 2 - y) };
    }).filter(({ distance }) => distance < radius).sort((a, b) => a.distance - b.distance).slice(0, 8);

    nearby.forEach(({ grain, distance }) => {
      const proximity = 1 - distance / radius;
      const dx = Math.sign(strength) * (7 + Math.min(1, Math.abs(strength)) * 18) * proximity;
      const lift = 5 * proximity;
      // The inner grain takes the gust; its parent keeps the snowfall uninterrupted.
      const start = getComputedStyle(grain).transform;
      gusts.get(grain)?.cancel();
      const animation = grain.animate([
        { transform: start, offset: 0 },
        { transform: `translate(${dx}px, ${-lift}px)`, offset: 0.25 },
        { transform: 'translate(0, 0)', offset: 1 }
      ], { duration: 1100, easing: 'ease-out' });
      gusts.set(grain, animation);
      const settled = () => { if (gusts.get(grain) === animation) gusts.delete(grain); };
      animation.finished.then(settled, settled);
    });
  });

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
    cancelGusts();
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
    cancelGusts();
    resizeObserver?.disconnect();
    visibilityObserver?.disconnect();
    listeners.abort();
    snow.replaceChildren();
    flakes.length = 0;
  }, { once: true });
  update();
})();
