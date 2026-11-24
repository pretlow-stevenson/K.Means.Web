(() => {
  const scene = document.querySelector('.holiday-ornaments');
  if (!scene || !window.requestAnimationFrame || !window.PointerEvent) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sessionKey = 'kmeans-holiday-ornaments-seen';
  const limit = 0.55;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const ornaments = Array.from(scene.querySelectorAll('.ornament-pendulum'), (element) => ({
    element,
    button: element.querySelector('button'),
    angle: 0,
    velocity: 0,
    length: 1,
    radius: 1,
    anchorX: 0,
    anchorY: 0
  }));
  if (ornaments.length !== 2 || ornaments.some((ornament) => !ornament.button)) return;

  let frame = 0;
  let previousTime = 0;
  let runningTime = 0;
  let inView = false;
  let arrived = false;
  let drag = null;
  let suppressClick = false;

  const render = () => ornaments.forEach((ornament) => {
    ornament.element.style.setProperty('--angle', `${-ornament.angle}rad`);
  });

  const cancelDrag = () => {
    if (!drag) return;
    const { ornament, pointerId } = drag;
    drag = null;
    ornament.button.classList.remove('is-held');
    if (ornament.button.hasPointerCapture(pointerId)) {
      ornament.button.releasePointerCapture(pointerId);
    }
  };

  const rest = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    cancelDrag();
    ornaments.forEach((ornament) => {
      ornament.angle = 0;
      ornament.velocity = 0;
    });
    render();
  };

  const measure = () => {
    ornaments.forEach((ornament) => {
      ornament.length = ornament.element.offsetHeight;
      ornament.anchorX = ornament.element.offsetLeft;
      ornament.anchorY = ornament.element.offsetTop;
      ornament.radius = ornament.button.querySelector('.ornament-sphere').offsetWidth / 2;
    });
  };

  const position = (ornament) => ({
    x: ornament.anchorX + Math.sin(ornament.angle) * ornament.length,
    y: ornament.anchorY + Math.cos(ornament.angle) * ornament.length
  });

  // Resolve contact along each pendulum's tangent so the cords keep their length.
  const collide = () => {
    const [a, b] = ornaments;
    const pa = position(a);
    const pb = position(b);
    const dx = pb.x - pa.x;
    const dy = pb.y - pa.y;
    const distance = Math.hypot(dx, dy);
    const overlap = a.radius + b.radius - distance;
    if (overlap <= 0 || distance < 0.001) return;

    const nx = dx / distance;
    const ny = dy / distance;
    const tangentA = nx * Math.cos(a.angle) - ny * Math.sin(a.angle);
    const tangentB = nx * Math.cos(b.angle) - ny * Math.sin(b.angle);
    const freeA = drag?.ornament === a ? 0 : 1;
    const freeB = drag?.ornament === b ? 0 : 1;
    const weight = freeA * tangentA ** 2 + freeB * tangentB ** 2;
    if (weight < 0.01) return;

    a.angle -= freeA * overlap * tangentA / (a.length * weight);
    b.angle += freeB * overlap * tangentB / (b.length * weight);
    const approach = b.velocity * b.length * tangentB - a.velocity * a.length * tangentA;
    if (approach < 0) {
      const impulse = -(1.35 * approach) / weight;
      a.velocity -= freeA * impulse * tangentA / a.length;
      b.velocity += freeB * impulse * tangentB / b.length;
    }
  };

  const constrain = (ornament) => {
    const bounded = clamp(ornament.angle, -limit, limit);
    if (bounded !== ornament.angle) ornament.velocity *= -0.15;
    ornament.angle = bounded;
    ornament.velocity = clamp(ornament.velocity, -2.4, 2.4);
  };

  const tick = (time) => {
    frame = 0;
    if (document.hidden || !inView || reducedMotion.matches) return;
    const elapsed = Math.min((time - previousTime) / 1000, 0.05);
    previousTime = time;
    runningTime += elapsed;
    const steps = Math.max(1, Math.ceil(elapsed * 120));
    const dt = elapsed / steps;

    for (let step = 0; step < steps; step += 1) {
      ornaments.forEach((ornament) => {
        if (drag?.ornament === ornament) return;
        ornament.velocity -= (780 / ornament.length) * Math.sin(ornament.angle) * dt;
        ornament.velocity *= Math.exp(-1.65 * dt);
        ornament.angle += ornament.velocity * dt;
      });
      collide();
      ornaments.forEach(constrain);
    }
    render();

    if (!drag && (runningTime > 10 || ornaments.every((ornament) =>
      Math.abs(ornament.angle) < 0.004 && Math.abs(ornament.velocity) < 0.015
    ))) {
      rest();
      return;
    }
    frame = requestAnimationFrame(tick);
  };

  const wake = () => {
    runningTime = 0;
    if (frame || reducedMotion.matches || document.hidden || !inView) return;
    previousTime = performance.now();
    frame = requestAnimationFrame(tick);
  };

  const arrive = () => {
    if (arrived || document.hidden || !inView) return;
    arrived = true;
    if (reducedMotion.matches) return;
    try {
      if (sessionStorage.getItem(sessionKey)) return;
      sessionStorage.setItem(sessionKey, 'true');
    } catch {
      // Private browsing can disable storage; motion remains once per page load.
    }
    ornaments[0].angle = -0.13;
    ornaments[1].angle = 0.17;
    render();
    wake();
  };

  const pointerAngle = (event, ornament) => {
    const rect = scene.getBoundingClientRect();
    const scale = rect.width / scene.offsetWidth;
    return Math.atan2(
      (event.clientX - rect.left) / scale - ornament.anchorX,
      (event.clientY - rect.top) / scale - ornament.anchorY
    );
  };

  const nudge = (ornament, direction = 1) => {
    if (reducedMotion.matches) {
      ornament.angle = clamp(ornament.angle + direction * 0.12, -limit, limit);
      ornament.velocity = 0;
      collide();
      ornaments.forEach(constrain);
      render();
      return;
    }
    ornament.velocity = direction * 0.9;
    wake();
  };

  ornaments.forEach((ornament) => {
    const { button } = ornament;
    button.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || drag || !inView) return;
      event.preventDefault();
      measure();
      suppressClick = false;
      drag = {
        ornament,
        pointerId: event.pointerId,
        offset: ornament.angle - pointerAngle(event, ornament),
        time: performance.now(),
        moved: false
      };
      ornament.velocity = 0;
      button.setPointerCapture(event.pointerId);
      button.classList.add('is-held');
      button.focus({ preventScroll: true });
      wake();
    });

    button.addEventListener('pointermove', (event) => {
      if (drag?.pointerId !== event.pointerId || drag.ornament !== ornament) return;
      const time = performance.now();
      const angle = clamp(pointerAngle(event, ornament) + drag.offset, -limit, limit);
      const delta = angle - ornament.angle;
      if (Math.abs(delta) > 0.003) drag.moved = true;
      ornament.velocity = clamp(delta / Math.max((time - drag.time) / 1000, 0.008), -2.4, 2.4);
      ornament.angle = angle;
      drag.time = time;
      // Direct manipulation remains available with reduced motion, without inertia.
      if (reducedMotion.matches) {
        collide();
        ornaments.forEach(constrain);
      }
      render();
    });

    const release = (event) => {
      if (drag?.pointerId !== event.pointerId || drag.ornament !== ornament) return;
      suppressClick = drag.moved;
      if (performance.now() - drag.time > 80) ornament.velocity = 0;
      cancelDrag();
      if (reducedMotion.matches || event.type !== 'pointerup') rest();
      else wake();
    };
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
    button.addEventListener('click', (event) => {
      if (!suppressClick || event.detail === 0) nudge(ornament);
      suppressClick = false;
    });
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        rest();
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        nudge(ornament, event.key === 'ArrowLeft' ? -1 : 1);
      }
    });
  });

  scene.hidden = false;
  measure();
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) arrive();
      else rest();
    }, { threshold: 0.2 }).observe(scene);
  } else {
    inView = true;
    arrive();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) rest();
    else arrive();
  });
  window.addEventListener('blur', rest);
  window.addEventListener('pagehide', rest);
  window.addEventListener('resize', () => {
    rest();
    measure();
  }, { passive: true });
  reducedMotion.addEventListener('change', rest);
})();
