const sheet = document.createElement('link');
sheet.rel = 'stylesheet';
sheet.href = new URL('./disclosures.css?v=20261016-smooth-tiles', import.meta.url).href;
sheet.addEventListener('load', initializeDisclosures, {once: true});
document.head.append(sheet);

function initializeDisclosures() {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const disclosures = new Map();
  const grids = new Map();
  let layoutFrame = 0;

  function queueLayout() {
    if (!layoutFrame) layoutFrame = window.requestAnimationFrame(layoutTiles);
  }

  function layoutTiles() {
    layoutFrame = 0;
    for (const [grid, cards] of grids) {
      if (!grid.isConnected || !grid.getClientRects().length) continue;
      const columns = window.getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length;
      grid.classList.toggle('independent-tiles-single', columns === 1);
      const gap = Number.parseFloat(grid.style.getPropertyValue('--independent-tile-gap')) || 24;
      for (const card of cards) {
        const span = columns === 1 ? 'auto' : `span ${Math.ceil(card.getBoundingClientRect().height + gap)}`;
        if (card.style.gridRowEnd !== span) card.style.gridRowEnd = span;
      }
    }
  }

  const tileObserver = 'ResizeObserver' in window ? new ResizeObserver(queueLayout) : null;

  function prepareGrid(details) {
    const grid = details.closest('.project-grid, .credential-grid, .sample-grid, .case-grid, .resume-capabilities, .resume-projects');
    if (!grid || grids.has(grid) || !tileObserver || window.getComputedStyle(grid).display !== 'grid') return;
    const gap = window.getComputedStyle(grid).rowGap;
    const cards = Array.from(grid.children);
    grid.style.setProperty('--independent-tile-gap', gap);
    grid.classList.add('independent-tiles');
    grids.set(grid, cards);
    tileObserver.observe(grid);
    for (const card of cards) tileObserver.observe(card);
    queueLayout();
  }

  function finish(state) {
    state.animation?.cancel();
    state.animation = null;
    state.details.open = state.target;
    state.clip.inert = !state.target;
    state.clip.style.removeProperty('overflow');
    state.summary.removeAttribute('aria-expanded');
    queueLayout();
  }

  function animateTo(state, expand, nativeOpening = false) {
    const startHeight = nativeOpening || !state.details.open ? 0 : state.clip.getBoundingClientRect().height;
    const startOpacity = nativeOpening || !state.details.open ? 0 : Number.parseFloat(window.getComputedStyle(state.clip).opacity);
    state.animation?.cancel();
    state.animation = null;
    state.target = expand;
    if (preference.matches || !state.clip.animate || document.visibilityState === 'hidden') {
      finish(state);
      return;
    }
    state.details.open = true;
    state.clip.inert = !expand;
    state.summary.setAttribute('aria-expanded', String(expand));
    const endHeight = expand ? state.body.getBoundingClientRect().height : 0;
    state.clip.style.overflow = 'hidden';
    const animation = state.clip.animate([
      {height: `${startHeight}px`, opacity: startOpacity},
      {height: `${endHeight}px`, opacity: expand ? 1 : 0}
    ], {
      duration: Math.min(420, Math.max(240, 240 + Math.abs(endHeight - startHeight) * .12)),
      easing: 'cubic-bezier(.22, 1, .36, 1)',
      fill: 'both'
    });
    state.animation = animation;
    animation.finished.then(() => {
      if (state.animation === animation) finish(state);
    }).catch(() => {});
  }

  function prepareDetails(details) {
    if (disclosures.has(details)) return;
    const summary = Array.from(details.children).find(child => child.tagName === 'SUMMARY');
    if (!summary) return;
    const clip = document.createElement('div');
    const body = document.createElement('div');
    clip.className = 'disclosure-clip';
    body.className = 'disclosure-body';
    const state = {details, summary, clip, body, target: details.open, animation: null};
    disclosures.set(details, state);
    for (const node of Array.from(details.childNodes)) {
      if (node !== summary) body.append(node);
    }
    clip.append(body);
    details.append(clip);
    clip.inert = !details.open;
    summary.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (event.target instanceof Element && event.target.closest('a, button, input, select, textarea')) return;
      if (preference.matches || !clip.animate) return;
      event.preventDefault();
      animateTo(state, !(state.animation ? state.target : details.open));
    });
    details.addEventListener('toggle', () => {
      if (state.animation || details.open === state.target) return;
      if (details.open) animateTo(state, true, true);
      else {
        state.target = false;
        finish(state);
      }
    });
    if ('ResizeObserver' in window) {
      const contentObserver = new ResizeObserver(() => {
        if (state.animation && state.target) animateTo(state, true);
        queueLayout();
      });
      contentObserver.observe(body);
      state.contentObserver = contentObserver;
    }
    prepareGrid(details);
  }

  function discover() {
    for (const [details, state] of disclosures) {
      if (details.isConnected) continue;
      state.animation?.cancel();
      state.contentObserver?.disconnect();
      disclosures.delete(details);
    }
    for (const [grid, cards] of grids) {
      if (grid.isConnected) continue;
      tileObserver.unobserve(grid);
      for (const card of cards) tileObserver.unobserve(card);
      grids.delete(grid);
    }
    for (const details of document.querySelectorAll('details')) prepareDetails(details);
    queueLayout();
  }

  discover();
  new MutationObserver(discover).observe(document.body, {childList: true, subtree: true});
  window.addEventListener('resize', queueLayout);
  window.addEventListener('pageshow', queueLayout);
  if (document.fonts) document.fonts.ready.then(queueLayout);
  preference.addEventListener('change', () => {
    for (const state of disclosures.values()) {
      if (state.animation) finish(state);
    }
  });
  window.addEventListener('beforeprint', () => {
    for (const state of disclosures.values()) {
      if (state.animation) finish(state);
    }
  });
}
