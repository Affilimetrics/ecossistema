(function () {
  const storage = {
    theme: 'skallora-theme',
    sidebar: 'skallora-sidebar',
  };

  function setTheme(theme) {
    const chosen = theme === 'dark' ? 'dark' : 'light';
    const root = document.documentElement;
    root.dataset.appTheme = chosen;
    root.dataset.bsTheme = chosen;
    try { localStorage.setItem(storage.theme, chosen); } catch (_) {}

    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      const icon = button.querySelector('.bi');
      const label = button.querySelector('.action-label');
      const nextLabel = chosen === 'dark' ? 'Usar tema claro' : 'Usar tema escuro';
      button.setAttribute('aria-label', nextLabel);
      button.setAttribute('title', nextLabel);
      if (icon) icon.className = chosen === 'dark' ? 'bi bi-sun' : 'bi bi-moon-stars';
      if (label) label.textContent = chosen === 'dark' ? 'Tema claro' : 'Tema escuro';
    });
  }

  function setSidebarCollapsed(collapsed) {
    const aside = document.querySelector('.app-sidebar');
    document.body.classList.toggle('sidebar-collapsed', collapsed);
    if (aside) aside.classList.toggle('is-collapsed', collapsed);
    const button = document.querySelector('[data-sidebar-toggle]');
    if (button) {
      button.setAttribute('aria-expanded', String(!collapsed));
      const icon = button.querySelector('.bi');
      const label = button.querySelector('.action-label');
      if (icon) icon.className = collapsed ? 'bi bi-layout-sidebar-inset' : 'bi bi-layout-sidebar';
      if (label) label.textContent = collapsed ? 'Expandir menu' : 'Recolher menu';
      button.setAttribute('title', collapsed ? 'Expandir menu' : 'Recolher menu');
    }
    try { localStorage.setItem(storage.sidebar, collapsed ? 'collapsed' : 'expanded'); } catch (_) {}
  }

  let theme = 'light';
  let collapsed = false;
  try {
    const savedTheme = localStorage.getItem(storage.theme);
    if (savedTheme === 'dark' || savedTheme === 'light') theme = savedTheme;
    collapsed = localStorage.getItem(storage.sidebar) === 'collapsed';
  } catch (_) {}
  setTheme(theme);

  document.addEventListener('DOMContentLoaded', function () {
    setSidebarCollapsed(collapsed);

    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      button.addEventListener('click', function () {
        setTheme(document.documentElement.dataset.appTheme === 'dark' ? 'light' : 'dark');
        // Redraw existing Google Charts with colors matching the selected theme.
        window.dispatchEvent(new Event('skallora:themechange'));
      });
    });

    document.querySelectorAll('[data-sidebar-toggle]').forEach((button) => {
      button.addEventListener('click', function () {
        setSidebarCollapsed(!document.body.classList.contains('sidebar-collapsed'));
      });
    });

    document.querySelectorAll('.app-sidebar .nav-link').forEach((link) => {
      const label = link.querySelector('.nav-label');
      if (label && label.textContent.trim()) link.title = label.textContent.trim();
    });
  });
})();
