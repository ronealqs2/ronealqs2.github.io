(() => {
  const header = document.querySelector('.site-header');
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const navigation = header.querySelector('nav');
  const sectionLinks = Array.from(navigation.querySelectorAll('a[href^="#"]'))
    .map(link => ({link, section: document.getElementById(link.hash.slice(1))}))
    .filter(item => item.section);
  const indicator = document.createElement('span');
  indicator.className = 'section-nav-indicator';
  indicator.setAttribute('aria-hidden', 'true');
  navigation.append(indicator);
  let sectionPositions = [];
  let activeSectionLink = null;
  let navigationFrame = 0;
  let headerHeight = 0;
  function positionIndicator(link) {
    const navigationBounds = navigation.getBoundingClientRect();
    const linkBounds = link.getBoundingClientRect();
    indicator.style.width = `${linkBounds.width}px`;
    indicator.style.transform = `translate3d(${linkBounds.left - navigationBounds.left}px, ${linkBounds.bottom - navigationBounds.top - 3}px, 0)`;
    indicator.classList.add('is-ready');
  }
  function updateActiveSection() {
    navigationFrame = 0;
    const readingPosition = window.scrollY + headerHeight + 64;
    let current = sectionPositions[0];
    for (const item of sectionPositions) {
      if (item.top <= readingPosition) current = item;
      else break;
    }
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
      current = sectionPositions[sectionPositions.length - 1];
    }
    if (!current || activeSectionLink === current.link) return;
    for (const item of sectionLinks) item.link.removeAttribute('aria-current');
    current.link.setAttribute('aria-current', 'location');
    activeSectionLink = current.link;
    positionIndicator(current.link);
  }
  function measureSections() {
    headerHeight = header.getBoundingClientRect().height;
    sectionPositions = sectionLinks.map(item => ({
      link: item.link,
      top: item.section.getBoundingClientRect().top + window.scrollY
    })).sort((first, second) => first.top - second.top);
    updateActiveSection();
    if (activeSectionLink) positionIndicator(activeSectionLink);
  }
  window.addEventListener('scroll', () => {
    if (!navigationFrame) navigationFrame = window.requestAnimationFrame(updateActiveSection);
  }, {passive: true});
  window.addEventListener('resize', measureSections);
  window.addEventListener('load', measureSections);
  if ('ResizeObserver' in window) {
    const sectionObserver = new ResizeObserver(measureSections);
    sectionObserver.observe(header);
    for (const item of sectionLinks) sectionObserver.observe(item.section);
  }
  if (document.fonts) document.fonts.ready.then(measureSections);
  measureSections();
  let scrollAnimation = 0;
  let activeDestination = null;
  const resumeTabs = document.querySelector('.resume-jumps');
  const trainingSection = document.getElementById('training');
  let tabVisibilityFrame = 0;
  function updateResumeTabs() {
    tabVisibilityFrame = 0;
    if (!resumeTabs || !trainingSection) return;
    const boundary = header.getBoundingClientRect().height + resumeTabs.getBoundingClientRect().height + 24;
    const outsideResume = trainingSection.getBoundingClientRect().top <= boundary;
    resumeTabs.style.visibility = outsideResume ? 'hidden' : '';
    resumeTabs.style.pointerEvents = outsideResume ? 'none' : '';
  }
  window.addEventListener('scroll', () => {
    if (!tabVisibilityFrame) tabVisibilityFrame = window.requestAnimationFrame(updateResumeTabs);
  }, {passive: true});
  window.addEventListener('resize', updateResumeTabs);
  updateResumeTabs();
  function finishScroll(moveFocus) {
    if (scrollAnimation) window.cancelAnimationFrame(scrollAnimation);
    scrollAnimation = 0;
    document.documentElement.classList.remove('is-section-scrolling');
    delete document.documentElement.dataset.scrollDestination;
    const destination = activeDestination;
    activeDestination = null;
    if (moveFocus && destination) {
      destination.setAttribute('tabindex', '-1');
      destination.focus({preventScroll: true});
    }
  }
  function cancelScroll() {
    if (!activeDestination) return;
    window.scrollTo({top: window.scrollY, behavior: 'instant'});
    finishScroll(false);
  }
  function scrollToSection(destination) {
    cancelScroll();
    const initialPosition = window.scrollY;
    const offset = header.getBoundingClientRect().height + 8;
    const targetPosition = Math.max(0, Math.min(initialPosition + destination.getBoundingClientRect().top - offset, document.documentElement.scrollHeight - window.innerHeight));
    activeDestination = destination;
    if (preference.matches || Math.abs(targetPosition - initialPosition) < 1) {
      window.scrollTo({top: targetPosition, behavior: 'instant'});
      finishScroll(true);
      return;
    }
    document.documentElement.classList.add('is-section-scrolling');
    document.documentElement.dataset.scrollDestination = destination.id;
    const started = performance.now();
    let lastPosition = initialPosition;
    let stableFrames = 0;
    function settle(timestamp) {
      if (!activeDestination) return;
      const position = window.scrollY;
      stableFrames = Math.abs(position - lastPosition) < .5 ? stableFrames + 1 : 0;
      lastPosition = position;
      if (Math.abs(position - targetPosition) < 1 || (timestamp - started > 160 && stableFrames >= 6) || timestamp - started > 3000) {
        finishScroll(true);
        return;
      }
      scrollAnimation = window.requestAnimationFrame(settle);
    }
    window.scrollTo({top: targetPosition, behavior: 'smooth'});
    scrollAnimation = window.requestAnimationFrame(settle);
  }
  window.addEventListener('wheel', cancelScroll, {passive: true});
  window.addEventListener('touchstart', cancelScroll, {passive: true});
  window.addEventListener('keydown', event => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', 'Escape', ' '].includes(event.key)) cancelScroll();
  });
  preference.addEventListener('change', event => {
    if (!event.matches || !activeDestination) return;
    const destination = activeDestination;
    cancelScroll();
    scrollToSection(destination);
  });
  function measureHeader() {
    document.documentElement.style.setProperty('--section-header-height', `${header.getBoundingClientRect().height + 8}px`);
  }
  measureHeader();
  if ('ResizeObserver' in window) new ResizeObserver(measureHeader).observe(header);
  window.addEventListener('resize', measureHeader);
  document.addEventListener('click', event => {
    const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
    if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const destination = document.getElementById(link.hash.slice(1));
    if (!destination) return;
    event.preventDefault();
    measureHeader();
    scrollToSection(destination);
    history.replaceState(null, '', link.hash);
  });
})();
