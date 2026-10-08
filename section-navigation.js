(() => {
  const header = document.querySelector('.site-header');
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let scrollAnimation = 0;
  let backgroundRotation = 0;
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
  function scrollToSection(destination) {
    if (scrollAnimation) window.cancelAnimationFrame(scrollAnimation);
    const initialPosition = window.scrollY;
    const offset = header.getBoundingClientRect().height + 8;
    const targetPosition = Math.max(0, Math.min(initialPosition + destination.getBoundingClientRect().top - offset, document.documentElement.scrollHeight - window.innerHeight));
    function finish() {
      scrollAnimation = 0;
      destination.setAttribute('tabindex', '-1');
      destination.focus({preventScroll: true});
    }
    if (preference.matches) {
      window.scrollTo({top: targetPosition, behavior: 'instant'});
      finish();
      return;
    }
    const started = performance.now();
    const duration = Math.min(1100, 650 + Math.abs(targetPosition - initialPosition) * .06);
    const background = document.querySelector('.network-orbit');
    const initialRotation = backgroundRotation;
    function step(timestamp) {
      const progress = Math.min(1, (timestamp - started) / duration);
      const eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      window.scrollTo({top: initialPosition + (targetPosition - initialPosition) * eased, behavior: 'instant'});
      if (background) {
        backgroundRotation = initialRotation + 35 * eased;
        background.style.rotate = `${backgroundRotation}deg`;
      }
      if (progress < 1) scrollAnimation = window.requestAnimationFrame(step);
      else finish();
    }
    scrollAnimation = window.requestAnimationFrame(step);
  }
  function cancelScroll() {
    if (scrollAnimation) window.cancelAnimationFrame(scrollAnimation);
    scrollAnimation = 0;
  }
  window.addEventListener('wheel', cancelScroll, {passive: true});
  window.addEventListener('touchstart', cancelScroll, {passive: true});
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
