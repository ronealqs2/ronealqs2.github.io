(() => {
  const root = document.documentElement;
  function applyTheme(value) {
    root.dataset.theme = value === 'light' ? 'light' : 'dark';
    const dark = root.dataset.theme === 'dark';
    const button = document.querySelector('.dossier-theme-button');
    if (button) {
      button.setAttribute('aria-pressed', String(dark));
      button.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
      button.firstElementChild.textContent = dark ? '☼' : '☾';
    }
  }
  let preference = 'dark';
  try { preference = localStorage.getItem('rq-theme') || 'dark'; } catch {}
  applyTheme(preference);
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(root.dataset.theme);
    document.querySelector('.dossier-theme-button').addEventListener('click', () => {
      const value = root.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(value);
      try { localStorage.setItem('rq-theme', value); } catch {}
    });
    const toggle = document.querySelector('.dossier-menu-button');
    const navigation = document.querySelector('#dossier-mobile-navigation');
    function closeMenu(focus = false) {
      navigation.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation menu');
      toggle.firstElementChild.textContent = '☰';
      if (focus) toggle.focus();
    }
    toggle.addEventListener('click', () => {
      const open = navigation.hidden;
      navigation.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
      toggle.firstElementChild.textContent = open ? '×' : '☰';
    });
    navigation.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !navigation.hidden) closeMenu(true); });
    document.addEventListener('pointerdown', event => { if (!event.target.closest('.dossier-header')) closeMenu(); });
    window.matchMedia('(min-width:768px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
    window.addEventListener('storage', event => { if (event.key === 'rq-theme') applyTheme(event.newValue); });
  });
})();
