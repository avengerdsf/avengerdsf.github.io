const THEME_KEY = "avengerdsf-site-theme";

function getPreferredTheme() {
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch (_) {}
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    const label = theme === "dark" ? "切换浅色主题" : "切换深色主题";
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
  });
}

function initTheme() {
  applyTheme(getPreferredTheme());
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem(THEME_KEY, theme);
        window.localStorage.setItem("theme", theme);
      } catch (_) {}
      applyTheme(theme);
    });
  });
  window.addEventListener("storage", (event) => {
    if (event.key === THEME_KEY && ["light", "dark"].includes(event.newValue)) applyTheme(event.newValue);
  });
}

function initNavigation() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const menu = document.querySelector("[data-nav-menu]");
  if (!toggle || !menu) return;
  const close = () => {
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "打开导航");
  };
  toggle.addEventListener("click", () => {
    const open = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "关闭导航" : "打开导航");
  });
  menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", close));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.classList.contains("is-open")) { close(); toggle.focus(); }
  });
  document.addEventListener("click", (event) => {
    if (!menu.contains(event.target) && !toggle.contains(event.target)) close();
  });
  window.matchMedia("(max-width: 640px)").addEventListener("change", close);
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initNavigation();
  document.querySelectorAll("[data-current-year]").forEach((element) => { element.textContent = String(new Date().getFullYear()); });
});
