(function () {
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => sidebar.classList.toggle('is-open'));
    document.addEventListener('click', (event) => {
      if (window.innerWidth <= 900 && sidebar.classList.contains('is-open') &&
          !sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
        sidebar.classList.remove('is-open');
      }
    });
  }

  document.querySelectorAll('[data-confirm]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      const message = form.getAttribute('data-confirm') || 'Confirmar esta operação?';
      if (!window.confirm(message)) event.preventDefault();
    });
  });

  document.querySelectorAll('.message-close').forEach((button) => {
    button.addEventListener('click', () => button.closest('.message')?.remove());
  });

  const fileInput = document.getElementById('id_file');
  const fileName = document.getElementById('fileName');
  if (fileInput && fileName) {
    fileInput.addEventListener('change', () => {
      fileName.textContent = fileInput.files?.[0]?.name || 'Nenhum arquivo selecionado';
    });
  }
})();
