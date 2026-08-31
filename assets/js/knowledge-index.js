function initKnowledgeProjectSearch() {
  const input = document.querySelector("[data-knowledge-search]");
  const cards = [...document.querySelectorAll("[data-knowledge-project]")];
  const empty = document.querySelector("[data-empty-state]");
  const count = document.querySelector("[data-result-count]");

  if (!input || !cards.length || !empty || !count) {
    return;
  }

  const filter = () => {
    const query = input.value.trim().toLowerCase();
    let visible = 0;

    cards.forEach((card) => {
      const searchText = (card.dataset.searchText || "").toLowerCase();
      const matches = !query || searchText.includes(query);
      card.hidden = !matches;
      if (matches) {
        visible += 1;
      }
    });

    count.textContent = `${visible} 个笔记项目`;
    empty.classList.toggle("is-visible", visible === 0);
  };

  input.addEventListener("input", filter);
  filter();
}

document.addEventListener("DOMContentLoaded", initKnowledgeProjectSearch);
