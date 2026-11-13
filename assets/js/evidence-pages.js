(() => {
  const brief = document.getElementById('alignment-evidence');
  const pages = Array.from(brief?.querySelectorAll('[data-evidence-page]') || []);
  const navigation = brief?.querySelector('[data-evidence-navigation]');
  const status = brief?.querySelector('[data-evidence-status]');

  if (pages.length < 2 || !navigation || !status) return;

  const links = Array.from(navigation.querySelectorAll('a'));
  const hashTarget = () => {
    try {
      return document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    } catch {
      return null;
    }
  };

  const showPage = (page, moveFocus = false, target = null) => {
    pages.forEach((candidate) => { candidate.hidden = candidate !== page; });
    links.forEach((link) => {
      if (link.hash === `#${page.id}`) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    status.textContent = `Page ${pages.indexOf(page) + 1} of ${pages.length} · ${page.querySelectorAll('article').length} briefs`;

    if (moveFocus) {
      // The heading receives keyboard focus; the URL keeps the stable archive target.
      const destination = target && page.contains(target) ? target : page;
      const heading = destination.matches('h3, h4') ? destination : destination.querySelector('h3, h4');
      brief.classList.add('is-visible');
      heading?.focus({ preventScroll: true });
      const header = document.querySelector('.site-header');
      const isSticky = header && ['sticky', 'fixed'].includes(getComputedStyle(header).position);
      const offset = isSticky ? header.getBoundingClientRect().height + 24 : 24;
      window.scrollTo({ top: Math.max(0, window.scrollY + destination.getBoundingClientRect().top - offset), behavior: 'instant' });
    }
  };

  const syncFromHash = (moveFocus = false) => {
    const target = hashTarget();
    const page = pages.find((candidate) => candidate === target || candidate.contains(target));
    if (page || target === brief || !window.location.hash) {
      showPage(page || pages[0], moveFocus && Boolean(target), target);
    }
  };

  // All evidence is readable without JavaScript. Only collapse it after setup succeeds.
  showPage(pages[0]);
  syncFromHash(Boolean(window.location.hash));
  window.addEventListener('hashchange', () => syncFromHash(true));

  navigation.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link || !navigation.contains(link) || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const page = pages.find((candidate) => `#${candidate.id}` === link.hash);
    if (!page) return;

    event.preventDefault();
    if (window.location.hash !== link.hash) window.history.pushState(null, '', link.hash);
    showPage(page, true);
  });
})();
