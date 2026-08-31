const THEME_KEY = "avengerdsf-site-theme";

function getPreferredTheme() {
  const savedTheme = window.localStorage.getItem(THEME_KEY);
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    button.setAttribute("aria-label", `Switch to ${nextTheme} theme`);
    button.setAttribute("title", `Switch to ${nextTheme} theme`);
  });
}

function initTheme() {
  applyTheme(getPreferredTheme());

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      window.localStorage.setItem(THEME_KEY, nextTheme);
      applyTheme(nextTheme);
    });
  });
}

function initNavigation() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const menu = document.querySelector("[data-nav-menu]");

  if (!toggle || !menu) {
    return;
  }

  const closeMenu = () => {
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  menu.querySelectorAll("a, button").forEach((item) => {
    item.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 720px)").matches) {
        closeMenu();
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  document.addEventListener("click", (event) => {
    if (!menu.classList.contains("is-open")) {
      return;
    }

    if (!menu.contains(event.target) && !toggle.contains(event.target)) {
      closeMenu();
    }
  });
}

function initReveal() {
  const elements = [...document.querySelectorAll(".reveal")];
  if (!elements.length) {
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );

  elements.forEach((element) => observer.observe(element));
}

function initYear() {
  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });
}

function initExternalLinks() {
  document.querySelectorAll('a[target="_blank"]').forEach((link) => {
    const rel = new Set((link.getAttribute("rel") || "").split(/\s+/).filter(Boolean));
    rel.add("noreferrer");
    rel.add("noopener");
    link.setAttribute("rel", [...rel].join(" "));
  });
}

function createHomeNote(title, description, tags) {
  const article = document.createElement("article");
  article.className = "home-direct-note";

  const heading = document.createElement("strong");
  heading.textContent = title;

  const copy = document.createElement("p");
  copy.textContent = description;

  const tagRow = document.createElement("div");
  tagRow.className = "tag-row";
  tags.forEach((tag) => {
    const chip = document.createElement("span");
    chip.className = "tag";
    chip.textContent = tag;
    tagRow.appendChild(chip);
  });

  article.append(heading, copy, tagRow);
  return article;
}

function initHomeKnowledgePreview() {
  const knowledgeSection = document.querySelector("#knowledge");
  const stack = knowledgeSection?.querySelector(".knowledge-stack");
  if (!knowledgeSection || !stack) {
    return;
  }

  document.querySelectorAll('.site-header a[href="knowledge/"], .hero a[href="knowledge/"], .now-stamp a[href="knowledge/"]').forEach((link) => {
    link.href = "#knowledge";
  });

  const heading = knowledgeSection.querySelector(".knowledge-feature h2");
  const copy = knowledgeSection.querySelector(".knowledge-feature > p:not(.eyebrow)");
  if (heading) {
    heading.textContent = "知识先在主页直接露出，完整库再负责搜索和归档。";
  }
  if (copy) {
    copy.textContent = "这里直接展示当前最常用的笔记主题，不需要先进入目录再点第二次。需要全文搜索或按分类浏览时，再进入完整知识库。";
  }

  const direct = document.createElement("div");
  direct.className = "home-direct-knowledge";
  direct.append(
    createHomeNote("力扣高频算法笔记", "二分先统一边界语义；滑动窗口维护合法状态；图问题区分 DFS/BFS；DP 先定义状态再写转移。", ["二分", "滑窗", "DFS/BFS", "DP"]),
    createHomeNote("GDB 调试工作流", "pending breakpoint → run → 函数/行断点 → n/s/finish；多线程再进入 info threads、thread apply all bt 与 scheduler-locking。", ["GDB", "Threads", "Breakpoint"]),
    createHomeNote("RL → Sim-to-Sim → Sim-to-Real", "训练工程、策略回放、MuJoCo 验证和实机部署应该按连续验证链组织，而不是相互独立的脚本。", ["PPO", "MJLab", "MuJoCo"]),
  );

  stack.replaceChildren(direct);
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initNavigation();
  initHomeKnowledgePreview();
  initReveal();
  initYear();
  initExternalLinks();
});
