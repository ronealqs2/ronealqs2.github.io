const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));
const projectCards = Array.from(document.querySelectorAll('#projects .project-card'));
const searchInput = document.querySelector('#project-search');
const resultsStatus = document.querySelector('#results-status');
const noResults = document.querySelector('#no-results');
let activeFilter = 'All';

function updateResults() {
  const query = searchInput.value.trim().toLowerCase();
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
  resultsStatus.textContent = `${visibleCount} project${visibleCount === 1 ? '' : 's'} shown`;
}

for (const button of filterButtons) {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    updateResults();
  });
}
searchInput.addEventListener('input', updateResults);
updateResults();
