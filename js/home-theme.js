(() => {
  const key = 'bemEsportivoHomeTheme';
  const root = document.documentElement;
  const valid = value => value === 'light' || value === 'dark';
  const read = () => { try { return localStorage.getItem(key); } catch { return null; } };
  const query = new URLSearchParams(location.search).get('tema');
  const saved = read();
  function apply(theme) {
    root.dataset.homeTheme = theme;
    const select = document.getElementById('home-theme-select');
    if (select) select.value = theme;
  }
  apply(query === 'branco' ? 'light' : query === 'escuro' ? 'dark' : valid(saved) ? saved : 'dark');
  window.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('home-theme-select');
    if (!select) return;
    apply(root.dataset.homeTheme);
    select.closest('.home-theme-control').hidden = false;
    select.addEventListener('change', () => {
      if (!valid(select.value)) return;
      apply(select.value);
      try { localStorage.setItem(key, select.value); } catch { /* Current visit still works. */ }
      const url = new URL(location.href);
      url.searchParams.delete('tema');
      history.replaceState(history.state, '', url.pathname + url.search + url.hash);
    });
  });
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    const theme = read();
    apply(valid(theme) ? theme : 'dark');
  });
})();
