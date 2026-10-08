const printButton = document.querySelector('#print-resume');
if (printButton) {
  printButton.addEventListener('click', () => window.print());
}

const sectionNavigation = document.querySelector('.resume-jumps');
if (sectionNavigation) {
  const header = document.querySelector('.site-header');
  const sectionLinks = Array.from(sectionNavigation.querySelectorAll('a[href^="#"]'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let headerOffset = 0;
  let scrollFrame = 0;
  function updatePinnedAppearance() {
    scrollFrame = 0;
    sectionNavigation.classList.toggle('is-pinned', sectionNavigation.getBoundingClientRect().top <= headerOffset + 1);
  }
  function measureNavigation() {
    const headerPosition = header ? window.getComputedStyle(header).position : '';
    const headerHeight = header && ['sticky', 'fixed'].includes(headerPosition) ? header.getBoundingClientRect().height : 0;
    headerOffset = headerHeight;
    document.documentElement.style.setProperty('--resume-header-offset', `${headerHeight}px`);
    document.documentElement.style.setProperty('--resume-section-offset', `${headerHeight + sectionNavigation.getBoundingClientRect().height + 18}px`);
    updatePinnedAppearance();
  }
  function selectSection(link) {
    for (const item of sectionLinks) {
      if (item === link) item.setAttribute('aria-current', 'location');
      else item.removeAttribute('aria-current');
    }
  }
  for (const link of sectionLinks) {
    link.addEventListener('click', event => {
      const section = document.querySelector(link.getAttribute('href'));
      if (!section) return;
      event.preventDefault();
      measureNavigation();
      selectSection(link);
      section.scrollIntoView({behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start'});
      section.setAttribute('tabindex', '-1');
      section.focus({preventScroll: true});
      history.replaceState(null, '', link.getAttribute('href'));
    });
  }
  measureNavigation();
  window.addEventListener('resize', measureNavigation);
  window.addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updatePinnedAppearance);
  }, {passive: true});
  if ('ResizeObserver' in window) {
    const navigationSize = new ResizeObserver(measureNavigation);
    navigationSize.observe(sectionNavigation);
    if (header) navigationSize.observe(header);
  }
}
