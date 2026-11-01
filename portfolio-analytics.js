/* Aggregate portfolio traffic. Dashboard access is managed in GoatCounter.
 * No credentials or private analytics access tokens belong in this file.
 */
(function () {
  'use strict';
  if (window.location.hostname !== 'ronealqs2.github.io') return;
  if (window.goatcounter || document.querySelector('script[data-goatcounter]')) return;
  try {
    if (window.localStorage.getItem('portfolio-analytics-opt-out') === 'true') return;
  } catch (_) { /* Restricted browser storage must not affect the portfolio. */ }

  var path = window.location.pathname.replace(/\/index\.html$/, '/');
  if (path === '/index.html') path = '/';
  var titles = {
    '/': 'Portfolio home',
    '/about.html': 'About',
    '/skills.html': 'Skills',
    '/resume.html': 'Resume',
    '/training.html': 'Education and credentials',
    '/project-library.html': 'Project library',
    '/projects/': 'Project collection',
    '/projects/soc.html': 'SOC Authentication Analysis',
    '/projects/iam.html': 'IAM and Active Directory',
    '/projects/grc.html': 'Sentinel GRC Assessment',
    '/grc/sentinel/': 'Sentinel assessment brief',
    '/grc/sentinel/workspace.html': 'Sentinel interactive workspace'
  };
  if (!Object.prototype.hasOwnProperty.call(titles, path)) return;

  var referrer = '';
  try {
    var source = new URL(document.referrer);
    if (source.hostname !== window.location.hostname) referrer = source.origin;
  } catch (_) { /* Direct visits have no referrer. */ }

  window.goatcounter = {path: path, title: titles[path], referrer: referrer};
  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://gc.zgo.at/count.js';
  script.setAttribute('data-goatcounter', 'https://ronealqs2-portfolio.goatcounter.com/count');
  document.head.appendChild(script);
})();
