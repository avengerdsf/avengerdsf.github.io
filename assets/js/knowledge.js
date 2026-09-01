const state = {
  category: "All",
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

function getCategories() {
  return ["All", ...new Set(getEntries().map((entry) => entry.dataset.category).filter(Boolean))];
}

function matchesEntry(entry) {
  if (state.category !== "All" && entry.dataset.category !== state.category) {
    return false;
  }

  const query = normalize(state.query);
  if (!query) {
    return true;
  }

  const searchable = normalize(`${entry.textContent || ""} ${entry.dataset.sourcePath || ""}`);
  return searchable.includes(query);
}

function renderFilters(container) {
  container.replaceChildren();

  getCategories().forEach((category) => {
    const button = document.createElement("button");
    button.className = `filter-chip${category === state.category ? " is-active" : ""}`;
    button.type = "button";
    button.textContent = category;
    button.dataset.category = category;
    button.setAttribute("aria-pressed", String(category === state.category));
    button.addEventListener("click", () => {
      state.category = category;
      render();
    });
    container.appendChild(button);
  });
}

function syncTopicCards() {
  document.querySelectorAll("[data-topic-category]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.topicCategory === state.category));
  });
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
  const filterContainer = document.querySelector("[data-filter-row]");
  const resultCount = document.querySelector("[data-result-count]");
  const emptyState = document.querySelector("[data-empty-state]");
  const grid = document.querySelector("[data-knowledge-grid]");

  if (!filterContainer || !resultCount || !emptyState || !grid) {
    return;
  }

  let visibleCount = 0;
  entries.forEach((entry) => {
    const visible = matchesEntry(entry);
    entry.hidden = !visible;
    if (visible) visibleCount += 1;
  });

  syncGroups();
  renderFilters(filterContainer);
  syncTopicCards();

  resultCount.textContent = `${visibleCount} 篇 Markdown 笔记`;
  emptyState.classList.toggle("is-visible", visibleCount === 0);
  grid.hidden = visibleCount === 0;
}

function initTopicCards() {
  document.querySelectorAll("[data-topic-category]").forEach((button) => {
    button.addEventListener("click", () => {
      state.category = button.dataset.topicCategory || "All";
      render();
      const source = [...document.querySelectorAll("[data-knowledge-source]")].find(
        (element) => element.dataset.sourceCategory === state.category,
      );
      source?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
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
  const searchInput = document.querySelector("[data-knowledge-search]");
  const resetButton = document.querySelector("[data-reset-search]");

  searchInput?.addEventListener("input", (event) => {
    state.query = event.currentTarget.value;
    render();
  });

  resetButton?.addEventListener("click", () => {
    state.query = "";
    state.category = "All";
    if (searchInput) {
      searchInput.value = "";
      searchInput.focus();
    }
    render();
  });

  initTopicCards();
  render();
  scrollToInitialHash();
}

document.addEventListener("DOMContentLoaded", initKnowledgeSearch);
