const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));
const projectCards = Array.from(document.querySelectorAll('#projects .project-card'));
const searchInput = document.querySelector('#project-search');
const resultsStatus = document.querySelector('#results-status');
const noResults = document.querySelector('#no-results');
const moreProjects = document.querySelector('#more-projects');
const projectStateKey = 'rq-portfolio-project-context';
const parameters = new URLSearchParams(window.location.search);
const canonicalPath = path => path.replace(/index\.html$/, '');
let savedContext = null;
try { savedContext = JSON.parse(sessionStorage.getItem(projectStateKey)); } catch {}
const returning = parameters.get('return') === 'projects';
const historyReturn = performance.getEntriesByType('navigation')[0]?.type === 'back_forward';
const canRestore = savedContext && canonicalPath(savedContext.path || '') === canonicalPath(window.location.pathname) && (returning || historyReturn);
let activeFilter = 'All';
const availableFilters = filterButtons.map(button => button.dataset.filter);
if (canRestore && availableFilters.includes(savedContext.filter)) {
  activeFilter = savedContext.filter;
  searchInput.value = typeof savedContext.query === 'string' ? savedContext.query : '';
} else if (availableFilters.includes(parameters.get('category'))) {
  activeFilter = parameters.get('category');
}

function updateResults() {
  const query = searchInput.value.trim().toLowerCase();
  if (moreProjects && (activeFilter !== 'All' || query)) moreProjects.open = true;
  let visibleCount = 0;
  for (const card of projectCards) {
    const matchesCategory = activeFilter === 'All' || card.dataset.category === activeFilter;
    const matchesQuery = `${card.dataset.search} ${card.textContent}`.toLowerCase().includes(query);
    card.hidden = !(matchesCategory && matchesQuery);
    if (!card.hidden) visibleCount += 1;
  }
  for (const button of filterButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.filter === activeFilter));
  }
  noResults.hidden = visibleCount !== 0;
  resultsStatus.textContent = moreProjects && !moreProjects.open && activeFilter === 'All' && !query
    ? `${visibleCount} projects available · 3 featured`
    : `${visibleCount} project${visibleCount === 1 ? '' : 's'} shown`;
}

for (const button of filterButtons) {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    updateResults();
  });
}
searchInput.addEventListener('input', updateResults);
if (moreProjects) moreProjects.addEventListener('toggle', updateResults);
updateResults();

function rememberProjectContext() {
  try {
    sessionStorage.setItem(projectStateKey, JSON.stringify({
      path: window.location.pathname,
      filter: activeFilter,
      query: searchInput.value,
      scroll: window.scrollY
    }));
  } catch {}
}

document.addEventListener('click', event => {
  const link = event.target instanceof Element ? event.target.closest('#projects .project-card a[href]') : null;
  if (link && new URL(link.href).origin === window.location.origin) rememberProjectContext();
}, {capture: true});
window.addEventListener('pagehide', rememberProjectContext);
window.addEventListener('pageshow', event => {
  if (!returning || event.persisted) return;
  window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
    if (canRestore && Number.isFinite(savedContext.scroll)) {
      window.scrollTo({top: Math.max(0, savedContext.scroll), behavior: 'instant'});
    } else {
      const projects = document.getElementById('projects');
      const headerHeight = document.querySelector('.site-header')?.getBoundingClientRect().height || 0;
      window.scrollTo({top: Math.max(0, projects.getBoundingClientRect().top + window.scrollY - headerHeight - 12), behavior: 'instant'});
    }
    const address = new URL(window.location.href);
    address.searchParams.delete('return');
    history.replaceState(history.state, '', address.pathname + address.search + address.hash);
  }));
});

