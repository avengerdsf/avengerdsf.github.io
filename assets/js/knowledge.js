import { knowledgeCategories, knowledgeEntries } from "./knowledge-data.js";

const state = {
  category: "All",
  query: "",
};

function normalize(value) {
  return value.toLocaleLowerCase("zh-CN").trim();
}

function matchesEntry(entry) {
  const categoryMatches = state.category === "All" || entry.category === state.category;
  if (!categoryMatches) {
    return false;
  }

  const query = normalize(state.query);
  if (!query) {
    return true;
  }

  const searchableText = [entry.title, entry.description, entry.category, entry.source, ...entry.tags]
    .join(" ")
    .toLocaleLowerCase("zh-CN");

  return searchableText.includes(query);
}

function createTag(tag) {
  const element = document.createElement("span");
  element.className = "tag";
  element.textContent = tag;
  return element;
}

function createCard(entry) {
  const link = document.createElement("a");
  link.className = "knowledge-card reveal is-visible";
  link.href = entry.href;

  if (entry.kind === "repository") {
    link.target = "_blank";
    link.rel = "noreferrer noopener";
  }

  const topLine = document.createElement("div");
  topLine.className = "project-topline";

  const category = document.createElement("span");
  category.textContent = entry.category;

  const kind = document.createElement("span");
  kind.textContent = entry.kind === "article" ? "Article" : "Repository";

  topLine.append(category, kind);

  const title = document.createElement("h3");
  title.textContent = entry.title;

  const description = document.createElement("p");
  description.textContent = entry.description;

  const tags = document.createElement("div");
  tags.className = "tag-row";
  entry.tags.slice(0, 4).forEach((tag) => tags.appendChild(createTag(tag)));

  const footer = document.createElement("div");
  footer.className = "card-footer";

  const source = document.createElement("span");
  source.textContent = entry.source;

  const arrow = document.createElement("span");
  arrow.textContent = entry.kind === "repository" ? "↗" : "→";

  footer.append(source, arrow);
  link.append(topLine, title, description, tags, footer);
  return link;
}

function renderFilters(container) {
  container.replaceChildren();

  knowledgeCategories.forEach((category) => {
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

function render() {
  const grid = document.querySelector("[data-knowledge-grid]");
  const filterContainer = document.querySelector("[data-filter-row]");
  const resultCount = document.querySelector("[data-result-count]");
  const emptyState = document.querySelector("[data-empty-state]");

  if (!grid || !filterContainer || !resultCount || !emptyState) {
    return;
  }

  const matches = knowledgeEntries.filter(matchesEntry);
  grid.replaceChildren(...matches.map(createCard));
  renderFilters(filterContainer);
  resultCount.textContent = `${matches.length} / ${knowledgeEntries.length} 条内容`;
  emptyState.classList.toggle("is-visible", matches.length === 0);
  grid.hidden = matches.length === 0;
}

function initKnowledgeSearch() {
  const searchInput = document.querySelector("[data-knowledge-search]");
  const resetButton = document.querySelector("[data-reset-search]");

  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      state.query = event.currentTarget.value;
      render();
    });
  }

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      state.query = "";
      state.category = "All";
      if (searchInput) {
        searchInput.value = "";
        searchInput.focus();
      }
      render();
    });
  }

  render();
}

document.addEventListener("DOMContentLoaded", initKnowledgeSearch);
