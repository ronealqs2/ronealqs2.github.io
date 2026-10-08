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
  const graphic = graphicElement('svg', {viewBox: '0 0 800 800', focusable: 'false'});
  const definitions = graphicElement('defs', {});
  const spectrum = graphicElement('linearGradient', {id: 'network-spectrum', x1: '0%', y1: '0%', x2: '100%', y2: '100%'});
  for (const [offset, color] of [['0%', '#53f0ce'], ['40%', '#55bdff'], ['75%', '#aa8bff'], ['100%', '#ec8edb']]) spectrum.append(graphicElement('stop', {offset, 'stop-color': color}));
  definitions.append(spectrum);
  graphic.append(definitions);
  {
    network.classList.add('ambient-network-home');
    for (const radius of [220, 310, 365]) {
      graphic.append(graphicElement('circle', {cx: 400, cy: 400, r: radius, fill: 'none', stroke: 'currentColor', 'stroke-width': '.7', 'stroke-dasharray': radius === 310 ? '3 16' : '80 22 2 22', opacity: '.6'}));
    }
    graphic.append(graphicElement('path', {d: 'M35 400H110 M690 400H765 M400 35V110 M400 690V765', fill: 'none', stroke: 'currentColor', 'stroke-width': '1'}));
  }
  const networkPath = 'M160 180L330 110L510 210L640 130L690 350L560 490L670 650L410 690L290 530L120 610L90 360Z M160 180L290 530L510 210L560 490L330 110L90 360L410 690L690 350L160 180 M90 360L560 490 M120 610L670 650 M290 530L640 130';
  graphic.append(graphicElement('path', {fill: 'none', stroke: 'currentColor', 'stroke-width': '1', d: networkPath}));
  graphic.append(graphicElement('path', {class: 'ambient-stream', fill: 'none', stroke: '#b3fff0', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-dasharray': '12 110', d: networkPath}));
  const nodes = [];
  for (let row = 0; row < 7; row += 1) {
    for (let column = 0; column < 9; column += 1) {
      nodes.push([column * 120 - 80 + (row % 2) * 60, row * 145 - 35]);
    }
  }
  const connections = [];
  for (const [index, node] of nodes.entries()) {
    const row = Math.floor(index / 9);
    const column = index % 9;
    for (const neighbor of [column < 8 ? index + 1 : -1, row < 6 ? index + 9 : -1, row < 6 && column < 8 ? index + 10 : -1]) {
      if (neighbor < 0) continue;
      connections.push(`M${node[0]} ${node[1]}L${nodes[neighbor][0]} ${nodes[neighbor][1]}`);
    }
    graphic.append(graphicElement('circle', {cx: node[0], cy: node[1], r: '2.5', fill: 'url(#network-spectrum)'}));
  }
  graphic.append(graphicElement('path', {d: connections.join(' '), fill: 'none', stroke: 'url(#network-spectrum)', 'stroke-width': '.8', opacity: '.55'}));
  graphic.append(graphicElement('path', {d: connections.filter((connection, index) => index % 5 === 0).join(' '), class: 'ambient-stream', fill: 'none', stroke: '#81d8ff', 'stroke-width': '1.6', 'stroke-dasharray': '10 100'}));
  for (const [horizontal, vertical, radius] of [[160,180,4],[330,110,5],[510,210,4],[640,130,3],[690,350,5],[560,490,4],[670,650,3],[410,690,5],[290,530,4],[120,610,3],[90,360,5]]) {
    graphic.append(graphicElement('circle', {cx: horizontal, cy: vertical, r: radius, fill: 'currentColor'}));
  }
  const orbit = document.createElement('div');
  orbit.className = 'network-orbit';
  orbit.append(graphic);
  network.append(orbit);
  document.body.prepend(network);
  if (!window.CSS || !window.CSS.supports('animation-timeline', 'scroll()')) {
    let rotationFrame = 0;
    let scrollRange = 1;
    function measureScrollRange() {
      scrollRange = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    }
    function updateScrollRotation() {
      rotationFrame = 0;
      if (preference.matches) {
        graphic.style.transform = '';
        return;
      }
      const progress = Math.max(0, Math.min(1, window.scrollY / scrollRange));
      graphic.style.transform = `rotate(${-12 + progress * 40}deg)`;
    }
    function requestScrollRotation() {
      if (!rotationFrame) rotationFrame = window.requestAnimationFrame(updateScrollRotation);
    }
    measureScrollRange();
    window.addEventListener('scroll', requestScrollRotation, {passive: true});
    window.addEventListener('resize', () => { measureScrollRange(); requestScrollRotation(); });
    window.addEventListener('load', () => { measureScrollRange(); requestScrollRotation(); });
    preference.addEventListener('change', requestScrollRotation);
    requestScrollRotation();
  }
  let navigationPending = false;
  document.addEventListener('click', async event => {
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || link.hasAttribute('download') || (link.target && link.target !== '_self') || preference.matches || !orbit.animate) return;
    const destination = new URL(link.href, window.location.href);
    const current = new URL(window.location.href);
    if (destination.protocol !== current.protocol || destination.host !== current.host || destination.pathname === current.pathname || !destination.pathname.endsWith('.html')) return;
    event.preventDefault();
    if (navigationPending) return;
    navigationPending = true;
    const turn = orbit.animate([{rotate: '0deg'}, {rotate: '55deg'}], {duration: 320, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards'});
    try {
      await Promise.race([turn.finished, new Promise(resolve => window.setTimeout(resolve, 420))]);
    } catch {}
    window.location.assign(destination.href);
  });
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    navigationPending = false;
    if (orbit.getAnimations) for (const animation of orbit.getAnimations()) animation.cancel();
  });
  if (!('IntersectionObserver' in window) || !Element.prototype.animate || preference.matches) return;

  const animations = new Set();
  const targets = Array.from(document.querySelectorAll('.professional-card, .synthetic-demo, .bio-copy, .portrait-frame, .bio-block, .hero > div, .hero-panel, .recruiter-portrait, .section-heading, .section > h1, .section > h2, .quick-links > a, .project-card, .sample-grid > div, .credential-panel, .learning-panel, .about-panel, .case-study, .project-page > h1, .project-boundary, .resume-role, .resume-project, .resume-capabilities > article, .resume-education > article'));
  const observer = new IntersectionObserver(entries => {
    let stagger = 0;
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      if (preference.matches || document.visibilityState === 'hidden') continue;
      const animation = entry.target.animate(
        [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 520, delay: stagger * 55, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' }
      );
      stagger = (stagger + 1) % 3;
      animations.add(animation);
      animation.finished.then(() => animations.delete(animation)).catch(() => animations.delete(animation));
    }
  }, { threshold: 0.08 });

  for (const target of targets) observer.observe(target);
  preference.addEventListener('change', event => {
    if (!event.matches) return;
    observer.disconnect();
    for (const animation of animations) animation.cancel();
    animations.clear();
  });
  window.addEventListener('beforeprint', () => {
    observer.disconnect();
    for (const animation of animations) animation.cancel();
    animations.clear();
  });
})();
