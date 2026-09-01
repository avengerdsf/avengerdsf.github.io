const state = {
  query: "",
};

const legacyHashAliases = {
  "leetcode-core-patterns": "leetcode",
  "machine-learning-roadmap": "machine-learning",
};

function normalize(value) {
  return String(value || "").toLocaleLowerCase("zh-CN").trim();
}

function getEntries() {
  return [...document.querySelectorAll("[data-knowledge-entry]")];
}

function matchesEntry(entry) {
  const query = normalize(state.query);
  if (!query) return true;
  return normalize(entry.dataset.search).includes(query);
}

function syncGroups() {
  document.querySelectorAll("[data-knowledge-group]").forEach((group) => {
    const visible = [...group.querySelectorAll("[data-knowledge-entry]")].some((entry) => !entry.hidden);
    group.hidden = !visible;
  });

  document.querySelectorAll("[data-knowledge-source]").forEach((source) => {
    const visible = [...source.querySelectorAll("[data-knowledge-entry]")].some((entry) => !entry.hidden);
    source.hidden = !visible;
  });
}

function render() {
  const entries = getEntries();
  const resultCount = document.querySelector("[data-result-count]");
  const emptyState = document.querySelector("[data-empty-state]");
  const directory = document.querySelector("[data-knowledge-grid]");

  if (!resultCount || !emptyState || !directory) return;

  let visibleCount = 0;
  entries.forEach((entry) => {
    const visible = matchesEntry(entry);
    entry.hidden = !visible;
    if (visible) visibleCount += 1;
  });

  syncGroups();
  resultCount.textContent = `${visibleCount} 篇笔记`;
  emptyState.classList.toggle("is-visible", visibleCount === 0);
  directory.hidden = visibleCount === 0;
}

function scrollToInitialHash() {
  const rawId = decodeURIComponent(window.location.hash.slice(1));
  if (!rawId) return;

  const id = legacyHashAliases[rawId] || rawId;
  requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({ block: "start" });
  });
}

function initKnowledgeSearch() {
  const searchForm = document.querySelector("[data-knowledge-search-form]");
  const searchInput = document.querySelector("[data-knowledge-search]");
  const resetButton = document.querySelector("[data-reset-search]");

  searchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    state.query = searchInput?.value || "";
    render();
  });

  searchInput?.addEventListener("input", (event) => {
    state.query = event.currentTarget.value;
    render();
  });

  resetButton?.addEventListener("click", () => {
    state.query = "";
    if (searchInput) {
      searchInput.value = "";
      searchInput.focus();
    }
    render();
  });

  render();
  scrollToInitialHash();
}

document.addEventListener("DOMContentLoaded", initKnowledgeSearch);
