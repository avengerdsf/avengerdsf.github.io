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
  let state = {active:false, order:[]};
  try {
    const saved = JSON.parse(sessionStorage.getItem(key));
    state = {active:saved?.active === true, order:Array.isArray(saved?.order) ? saved.order : []};
  } catch {}
  let cleanup = () => {};
  const connect = () => {
    cleanup();
    const navigation = document.querySelector('[data-random-navigation]');
    if (navigation) {
      const inRandomMode = new URLSearchParams(window.location.search).get('browse') === 'random';
      const links = JSON.parse(navigation.dataset.randomLinks);
      const current = inRandomMode ? randomNoteNavigation(state, navigation.dataset.noteSlug, Object.keys(links)) : null;
      navigation.hidden = !current;
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
    const paint = () => {
      directories.hidden = state.active;
      list.hidden = !state.active;
      refresh.hidden = !state.active;
      toggle.textContent = state.active ? '返回题型目录' : '乱序浏览';
      toggle.setAttribute('aria-pressed', String(state.active));
    };
    const reshuffle = () => {
      shuffleNotes([...list.children]).forEach(item => list.append(item));
      save();
      paint();
    };
    const switchMode = () => {
      state.active = !state.active;
      if (state.active) reshuffle();
      else { save(); paint(); }
    };
    toggle.addEventListener('click', switchMode);
    refresh.addEventListener('click', reshuffle);
    cleanup = () => {
      toggle.removeEventListener('click', switchMode);
      refresh.removeEventListener('click', reshuffle);
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
