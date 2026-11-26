(function () {
  "use strict";

  const sidebar = document.getElementById("sidebar");
  const menuToggle = document.querySelector(".menu-toggle");

  if (sidebar && menuToggle) {
    menuToggle.addEventListener("click", function () {
      const opened = sidebar.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", String(opened));
      menuToggle.setAttribute("aria-label", opened ? "Fechar menu" : "Abrir menu");
      menuToggle.textContent = opened ? "×" : "☰";
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && sidebar.classList.contains("is-open")) {
        sidebar.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Abrir menu");
        menuToggle.textContent = "☰";
      }
    });
  }

  document.querySelectorAll(".toast-close").forEach(function (button) {
    button.addEventListener("click", function () {
      const toast = button.closest(".toast-message");
      if (toast) toast.remove();
    });
  });

  document.querySelectorAll("[data-confirm]").forEach(function (element) {
    element.addEventListener("click", function (event) {
      const message = element.getAttribute("data-confirm") || "Confirmar esta ação?";
      if (!window.confirm(message)) event.preventDefault();
    });
  });
})();
