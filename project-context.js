(() => {
  let context = null;
  try { context = JSON.parse(sessionStorage.getItem('rq-portfolio-project-context')); } catch {}
  const allowedPaths = ['/', '/index.html', '/project-library.html'];
  const destination = context && allowedPaths.includes(context.path) ? `${context.path}?return=projects#projects` : '../../index.html?category=GRC&return=projects#projects';
  for (const link of document.querySelectorAll('[data-return-projects]')) link.setAttribute('href', destination);
})();
