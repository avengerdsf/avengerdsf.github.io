import { notebookData } from './data.mjs';

export function leetcodeProblemNotes(files = []) {
  return notebookData(files, 'leetcode').notes.filter(note => !note.slug.endsWith('/overview'))
    .map(note => ({slug:note.slug, title:note.title}));
}

export function shuffleNotes(notes, random = Math.random) {
  const result = [...notes];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function randomNoteNavigation(state, slug, notes) {
  if (!state?.active || !Array.isArray(state.order)) return null;
  const available = new Set(notes);
  const order = [...new Set(state.order.filter(note => available.has(note)))];
  const index = order.indexOf(slug);
  return index < 0 ? null : {position:index + 1, total:order.length, nextSlug:order[index + 1] ?? null};
}

function installRandomBrowsing() {
  if (window.__knowledgeRandomBrowsing) return;
  window.__knowledgeRandomBrowsing = true;
  const key = 'avengerdsf-leetcode-random';
  let state = {active:false, order:[], view:'directories'};
  try {
    const saved = JSON.parse(sessionStorage.getItem(key));
    state = {active:saved?.active === true, order:Array.isArray(saved?.order) ? saved.order : [], view:['random','favorites','directories'].includes(saved?.view) ? saved.view : saved?.active ? 'random' : 'directories'};
  } catch {}
  let cleanup = () => {};
  const connect = () => {
    cleanup();
    const navigation = document.querySelector('[data-random-navigation]');
    if (navigation) {
      const inRandomMode = new URLSearchParams(window.location.search).get('browse') === 'random';
      const links = JSON.parse(navigation.dataset.randomLinks);
      const current = inRandomMode ? randomNoteNavigation(state, navigation.dataset.noteSlug, Object.keys(links)) : null;
      navigation.querySelector('[data-random-progress]').hidden = !current;
      navigation.querySelector('[data-random-return]').hidden = !current;
      navigation.querySelector('[data-random-next]').hidden = !current?.nextSlug;
      navigation.querySelector('[data-random-end]').hidden = !current || Boolean(current.nextSlug);
      navigation.querySelector('[data-favorites-return]').hidden = new URLSearchParams(window.location.search).get('browse') !== 'favorites';
      if (current) {
        navigation.querySelector('[data-random-progress]').textContent = `乱序浏览 · ${current.position} / ${current.total}`;
        const next = navigation.querySelector('[data-random-next]');
        next.hidden = !current.nextSlug;
        if (current.nextSlug) next.href = `${links[current.nextSlug]}?browse=random`;
        navigation.querySelector('[data-random-end]').hidden = Boolean(current.nextSlug);
      }
    }
    const panel = document.querySelector('.page > #quartz-body > .center .kb-overview[data-scope="leetcode"]');
    const directories = panel?.querySelector('.kb-directory-list');
    const list = panel?.querySelector('[data-random-notes]');
    const toggle = panel?.querySelector('[data-random-toggle]');
    const refresh = panel?.querySelector('[data-random-refresh]');
    const favoritesToggle = panel?.querySelector('[data-favorites-toggle]');
    const favoritesPanel = panel?.querySelector('[data-favorites-panel]');
    if (!directories || !list || !toggle || !refresh) return;
    const items = [...list.children];
    const bySlug = new Map(items.map(item => [item.dataset.noteSlug, item]));
    const previous = new Set(state.order);
    [...state.order.map(slug => bySlug.get(slug)).filter(Boolean), ...items.filter(item => !previous.has(item.dataset.noteSlug))]
      .forEach(item => list.append(item));
    const save = () => {
      state.order = [...list.children].map(item => item.dataset.noteSlug);
      try { sessionStorage.setItem(key, JSON.stringify(state)); } catch {}
    };
    const intent = new URLSearchParams(window.location.search).get('browse');
    if (intent === 'favorites' || intent === 'random' && state.active) {
      state.view = intent;
      const url = new URL(window.location.href);
      url.searchParams.delete('browse');
      history.replaceState(history.state,'',url);
      save();
    }
    const paint = () => {
      const favoriteView = state.view === 'favorites';
      directories.hidden = state.active || favoriteView;
      list.hidden = !state.active || favoriteView;
      refresh.hidden = !state.active || favoriteView;
      toggle.textContent = state.active && !favoriteView ? '返回题型目录' : '乱序浏览';
      toggle.setAttribute('aria-pressed', String(state.active && !favoriteView));
      if (!favoritesPanel || !favoritesToggle) return;
      favoritesPanel.hidden = !favoriteView;
      favoritesToggle.setAttribute('aria-pressed',String(favoriteView));
      const favorites = window.__knowledgeFavorites?.getState() || {items:[],connected:false};
      const selected = favorites.items.map(slug => bySlug.get(slug)).filter(Boolean);
      favoritesToggle.textContent = favorites.connected ? `收藏夹 (${selected.length})` : '收藏夹';
      const collection = favoritesPanel.querySelector('[data-favorite-notes]');
      collection.replaceChildren(...selected.map(item => {
        const clone = item.cloneNode(true);
        const link = clone.querySelector('a');
        const url = new URL(link.href);
        url.searchParams.set('browse','favorites');
        link.href = url.pathname + url.search;
        link.classList.replace('kb-random-note-link','kb-favorite-note-link');
        return clone;
      }));
      const status = favoritesPanel.querySelector('[data-favorites-status]');
      status.textContent = !favorites.connected ? '连接 GitHub 后查看收藏。' : favorites.loading ? '正在读取收藏…' : favorites.message || (selected.length ? '' : '还没有收藏题目。');
      status.hidden = !status.textContent;
    };
    const reshuffle = () => {
      state.view = 'random';
      shuffleNotes([...list.children]).forEach(item => list.append(item));
      save();
      paint();
    };
    const switchMode = () => {
      if (state.view === 'random') {
        state.active = false;
        state.view = 'directories';
        save(); paint();
      } else {
        const resume = state.view === 'favorites' && state.active;
        state.active = true;
        state.view = 'random';
        if (resume) { save(); paint(); }
        else reshuffle();
      }
    };
    const switchFavorites = () => {
      state.view = state.view === 'favorites' ? state.active ? 'random' : 'directories' : 'favorites';
      save(); paint();
      if (state.view === 'favorites') void window.__knowledgeFavorites?.refresh();
    };
    toggle.addEventListener('click', switchMode);
    refresh.addEventListener('click', reshuffle);
    favoritesToggle?.addEventListener('click',switchFavorites);
    document.addEventListener('knowledge:favorites-change',paint);
    cleanup = () => {
      toggle.removeEventListener('click', switchMode);
      refresh.removeEventListener('click', reshuffle);
      favoritesToggle?.removeEventListener('click',switchFavorites);
      document.removeEventListener('knowledge:favorites-change',paint);
    };
    paint();
  };
  document.addEventListener('nav', connect);
  document.addEventListener('render', connect);
  document.addEventListener('prenav', () => cleanup());
  if (document.readyState !== 'loading') connect();
  else document.addEventListener('DOMContentLoaded', connect, {once:true});
}

export const randomBrowseBridge = `(() => { ${shuffleNotes.toString()} ${randomNoteNavigation.toString()} (${installRandomBrowsing.toString()})(); })();`;
