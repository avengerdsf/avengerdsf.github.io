// Runs before the first paint. Both applications keep their native theme toggle.
export const themeBridge = `(() => {
  if (window.__knowledgeThemeBridge) return;
  window.__knowledgeThemeBridge = true;
  const root = document.documentElement;
  const valid = value => value === 'light' || value === 'dark';
  const save = theme => {
    if (!valid(theme)) return;
    try {
      localStorage.setItem('avengerdsf-site-theme', theme);
      localStorage.setItem('theme', theme);
    } catch (_) { /* Reading remains available when storage is blocked. */ }
  };
  try {
    const theme = localStorage.getItem('avengerdsf-site-theme');
    if (valid(theme)) {
      localStorage.setItem('theme', theme);
      root.setAttribute('saved-theme', theme);
    }
  } catch (_) {}
  new MutationObserver(() => save(root.getAttribute('saved-theme')))
    .observe(root, {attributes: true, attributeFilter: ['saved-theme']});
  window.addEventListener('storage', event => {
    if (event.key === 'avengerdsf-site-theme' && valid(event.newValue)) {
      root.setAttribute('saved-theme', event.newValue);
    }
  });
})();`;
