(() => {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const network = document.createElement('div');
  network.className = 'ambient-network';
  network.setAttribute('aria-hidden', 'true');
  function graphicElement(tag, attributes) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
    return element;
  }
  const graphic = graphicElement('svg', { viewBox: '0 0 800 800', focusable: 'false' });
  const definitions = graphicElement('defs', {});
  const spectrum = graphicElement('linearGradient', { id: 'network-spectrum', x1: '0%', y1: '0%', x2: '100%', y2: '100%' });
  for (const [offset, color] of [['0%', '#53f0ce'], ['40%', '#55bdff'], ['75%', '#aa8bff'], ['100%', '#ec8edb']]) spectrum.append(graphicElement('stop', { offset, 'stop-color': color }));
  definitions.append(spectrum);
  graphic.append(definitions);
  for (const radius of [220, 310, 365]) graphic.append(graphicElement('circle', { cx: 400, cy: 400, r: radius, fill: 'none', stroke: 'currentColor', 'stroke-width': '.7', 'stroke-dasharray': radius === 310 ? '3 16' : '80 22 2 22', opacity: '.6' }));
  const networkPath = 'M160 180L330 110L510 210L640 130L690 350L560 490L670 650L410 690L290 530L120 610L90 360Z M160 180L290 530L510 210L560 490L330 110L90 360L410 690L690 350L160 180 M90 360L560 490 M120 610L670 650 M290 530L640 130';
  graphic.append(graphicElement('path', { fill: 'none', stroke: 'currentColor', 'stroke-width': '1', d: networkPath }));
  graphic.append(graphicElement('path', { class: 'ambient-stream', fill: 'none', stroke: '#b3fff0', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-dasharray': '12 110', d: networkPath }));
  const nodes = [];
  for (let row = 0; row < 7; row += 1) {
    for (let column = 0; column < 9; column += 1) nodes.push([column * 120 - 80 + (row % 2) * 60, row * 145 - 35]);
  }
  const connections = [];
  for (const [index, node] of nodes.entries()) {
    const row = Math.floor(index / 9);
    const column = index % 9;
    for (const neighbor of [column < 8 ? index + 1 : -1, row < 6 ? index + 9 : -1, row < 6 && column < 8 ? index + 10 : -1]) {
      if (neighbor >= 0) connections.push(`M${node[0]} ${node[1]}L${nodes[neighbor][0]} ${nodes[neighbor][1]}`);
    }
    graphic.append(graphicElement('circle', { cx: node[0], cy: node[1], r: '2.5', fill: 'url(#network-spectrum)' }));
  }
  graphic.append(graphicElement('path', { d: connections.join(' '), fill: 'none', stroke: 'url(#network-spectrum)', 'stroke-width': '.8', opacity: '.55' }));
  graphic.append(graphicElement('path', { d: connections.filter((connection, index) => index % 5 === 0).join(' '), class: 'ambient-stream', fill: 'none', stroke: '#81d8ff', 'stroke-width': '1.6', 'stroke-dasharray': '10 100' }));
  for (const [horizontal, vertical, radius] of [[160,180,4],[330,110,5],[510,210,4],[640,130,3],[690,350,5],[560,490,4],[670,650,3],[410,690,5],[290,530,4],[120,610,3],[90,360,5]]) graphic.append(graphicElement('circle', { cx: horizontal, cy: vertical, r: radius, fill: 'currentColor' }));
  const orbit = document.createElement('div');
  orbit.className = 'network-orbit';
  orbit.append(graphic);
  network.append(orbit);
  document.body.prepend(network);

  let paused = false;
  try { paused = localStorage.getItem('sentinel-motion-paused') === 'true'; } catch {}
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'motion-toggle';
  document.querySelector('footer')?.append(toggle);
  const animations = new Set();
  let scrollFrame = 0;
  function updateRotation() {
    scrollFrame = 0;
    if (!paused && !preference.matches) graphic.style.transform = `rotate(${-12 + Math.max(0, window.scrollY) * .15}deg)`;
  }
  function requestRotation() {
    if (!scrollFrame && !paused && !preference.matches) scrollFrame = window.requestAnimationFrame(updateRotation);
  }
  function syncMotion() {
    document.body.dataset.motion = paused || preference.matches ? 'paused' : 'running';
    toggle.disabled = preference.matches;
    toggle.textContent = preference.matches ? 'Motion off · system preference' : paused ? 'Resume background motion' : 'Pause background motion';
    toggle.setAttribute('aria-pressed', String(paused || preference.matches));
    if (paused || preference.matches) {
      for (const animation of animations) animation.cancel();
      animations.clear();
    }
    if (preference.matches) graphic.style.transform = '';
    requestRotation();
  }
  toggle.addEventListener('click', () => {
    paused = !paused;
    try { localStorage.setItem('sentinel-motion-paused', String(paused)); } catch {}
    syncMotion();
  });
  preference.addEventListener('change', syncMotion);
  window.addEventListener('scroll', requestRotation, { passive: true });
  document.addEventListener('visibilitychange', () => {
    network.style.visibility = document.hidden ? 'hidden' : '';
    orbit.style.animationPlayState = document.hidden ? 'paused' : '';
    for (const stream of graphic.querySelectorAll('.ambient-stream')) stream.style.animationPlayState = document.hidden ? 'paused' : '';
  });

  function reveal(targets) {
    if (paused || preference.matches || document.hidden || !Element.prototype.animate) return;
    for (const [index, target] of [...targets].entries()) {
      const animation = target.animate([{ opacity: .35, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 480, delay: Math.min(index, 5) * 45, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
      animations.add(animation);
      animation.finished.then(() => animations.delete(animation)).catch(() => animations.delete(animation));
    }
  }
  let previousSection = '';
  function revealSection() {
    const currentSection = location.hash || '#dashboard';
    if (currentSection === previousSection) return;
    previousSection = currentSection;
    for (const animation of animations) animation.cancel();
    animations.clear();
    reveal(document.querySelectorAll('#content > .page-head, #content > .metrics > .metric, #content > .dashboard-grid > .panel, #content > .split-content > .panel, #content > .table-wrap, .concept-hero .hero-layout > *, .portfolio-concept .project-card'));
    if (!paused && !preference.matches && orbit.animate) {
      const turn = orbit.animate([{ rotate: '-5deg' }, { rotate: '0deg' }], { duration: 650, easing: 'cubic-bezier(.22,1,.36,1)' });
      animations.add(turn);
      turn.finished.then(() => animations.delete(turn)).catch(() => animations.delete(turn));
    }
  }
  window.addEventListener('hashchange', revealSection);
  window.addEventListener('beforeprint', () => {
    for (const animation of animations) animation.cancel();
    animations.clear();
  });
  syncMotion();
  revealSection();
})();
