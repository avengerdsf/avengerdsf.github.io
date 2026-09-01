import { knowledgeCategories, knowledgeEntries } from "./knowledge-data.js";

const state = {
  category: "All",
  query: "",
};

function normalize(value) {
  return value.toLocaleLowerCase("zh-CN").trim();
}

function flattenSection(section) {
  return [
    section.title || "",
    ...(section.paragraphs || []),
    ...(section.bullets || []),
    section.code || "",
  ].join(" ");
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

  const searchableText = [
    entry.title,
    entry.description,
    entry.category,
    entry.source,
    ...entry.tags,
    ...(entry.sections || []).map(flattenSection),
  ]
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

function createSection(section) {
  const sectionElement = document.createElement("section");
  sectionElement.className = "inline-note-section";

  const heading = document.createElement("h3");
  heading.textContent = section.title;
  sectionElement.appendChild(heading);

  (section.paragraphs || []).forEach((text) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    sectionElement.appendChild(paragraph);
  });

  if (section.bullets?.length) {
    const list = document.createElement("ul");
    section.bullets.forEach((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      list.appendChild(item);
    });
    sectionElement.appendChild(list);
  }

  if (section.code) {
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.textContent = section.code;
    pre.appendChild(code);
    sectionElement.appendChild(pre);
  }

  return sectionElement;
}

function createNote(entry) {
  const article = document.createElement("article");
  article.className = "knowledge-inline-note reveal is-visible";
  article.id = entry.id;

  const topLine = document.createElement("div");
  topLine.className = "knowledge-inline-topline";

  const category = document.createElement("span");
  category.className = "knowledge-meta-line";
  category.textContent = entry.category;

  const updated = document.createElement("span");
  updated.textContent = entry.updated ? `Updated ${entry.updated}` : entry.source;

  topLine.append(category, updated);

  const title = document.createElement("h2");
  title.textContent = entry.title;

  const description = document.createElement("p");
  description.className = "knowledge-inline-description";
  description.textContent = entry.description;

  const tags = document.createElement("div");
  tags.className = "tag-row";
  entry.tags.forEach((tag) => tags.appendChild(createTag(tag)));

  const body = document.createElement("div");
  body.className = "knowledge-inline-body";
  (entry.sections || []).forEach((section) => body.appendChild(createSection(section)));

  article.append(topLine, title, description, tags, body);

  if (entry.sourceUrl) {
    const footer = document.createElement("div");
    footer.className = "knowledge-inline-footer";

    const sourceLabel = document.createElement("span");
    sourceLabel.textContent = `Source · ${entry.source}`;

    const sourceLink = document.createElement("a");
    sourceLink.className = "button button-ghost";
    sourceLink.href = entry.sourceUrl;
    sourceLink.target = "_blank";
    sourceLink.rel = "noreferrer noopener";
    sourceLink.textContent = "查看公开源仓库 ↗";

    footer.append(sourceLabel, sourceLink);
    article.appendChild(footer);
  }

  return article;
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

function syncTopicCards() {
  document.querySelectorAll("[data-topic-category]").forEach((button) => {
    const isActive = button.dataset.topicCategory === state.category;
    button.setAttribute("aria-pressed", String(isActive));
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
  const fragment = document.createDocumentFragment();
  matches.forEach((entry) => fragment.appendChild(createNote(entry)));

  grid.replaceChildren(fragment);
  renderFilters(filterContainer);
  resultCount.textContent = `${matches.length} 篇笔记`;
  emptyState.classList.toggle("is-visible", matches.length === 0);
  grid.hidden = matches.length === 0;
  syncTopicCards();
}

function initTopicCards() {
  document.querySelectorAll("[data-topic-category]").forEach((button) => {
    button.addEventListener("click", () => {
      state.category = button.dataset.topicCategory || "All";
      render();
      document.querySelector("[data-knowledge-search]")?.focus({ preventScroll: true });
      document.querySelector("[data-result-count]")?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
}

function scrollToInitialHash() {
  const id = decodeURIComponent(window.location.hash.slice(1));
  if (!id) {
    return;
  }

  requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({ block: "start" });
  });
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

  initTopicCards();
  render();
  scrollToInitialHash();
}

document.addEventListener("DOMContentLoaded", initKnowledgeSearch);
