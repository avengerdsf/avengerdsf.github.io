/** Directory browsing is distinct from a recursive search result. */
const visible = file => typeof file.filePath === 'string' && /\.md$/i.test(file.filePath)
  && !['draft', 'unlisted'].some(key => [file[key], file.frontmatter?.[key]].some(value => value === true || value === 'true'));
const encodePath = path => path.split('/').map(encodeURIComponent).join('/');
const byTitle = (a, b) => a.title.localeCompare(b.title, 'zh-CN', {numeric:true});

export function directoryContents(files = [], scope = '') {
  const source = files.filter(file => file.slug && visible(file));
  const titles = new Map(source.filter(file => file.slug.endsWith('/index'))
    .map(file => [file.slug.slice(0,-6), String(file.frontmatter?.title || file.slug.split('/').at(-2))]));
  const prefix = scope ? `${scope}/` : '';
  const directories = new Map();
  const notes = [];
  for (const file of source) {
    if (!file.slug.startsWith(prefix)) continue;
    const relative = file.slug.slice(prefix.length);
    if (!relative || relative === 'index') continue;
    if (relative.includes('/')) {
      const segment = relative.split('/')[0];
      const slug = prefix + segment;
      directories.set(slug, {slug, title:titles.get(slug) || segment});
    } else {
      notes.push({slug:file.slug, title:String(file.frontmatter?.title || relative)});
    }
  }
  return {
    directories:[...directories.values()].sort((a,b) => a.slug.localeCompare(b.slug, 'en', {numeric:true})).map(directory => ({
      ...directory,
      previewNotes:source.filter(file => file.slug.startsWith(`${directory.slug}/`) && !file.slug.endsWith('/index'))
        .map(file => ({slug:file.slug, title:String(file.frontmatter?.title || file.slug.split('/').at(-1))}))
        .sort(byTitle).slice(0,5),
    })),
    notes:notes.sort(byTitle),
  };
}

export function parentDirectoryHref(slug) {
  if (!slug || slug === 'index') return null;
  const path = slug.endsWith('/index') ? slug.slice(0,-6) : slug;
  const parts = path.split('/');
  parts.pop();
  return `/knowledge/${parts.length ? `${encodePath(parts.join('/'))}/` : ''}`;
}

/** Keep desktop preference separate from the temporary mobile drawer. */
export function directoryState(state, action, mobile = state?.mobile ?? false) {
  if (!state) return {mobile, open: !mobile, desktopOpen: true};
  if (action === 'resize' && mobile !== state.mobile) return {mobile, open: mobile ? false : state.desktopOpen, desktopOpen: state.desktopOpen};
  if (action === 'navigate') return state.mobile ? {...state, open: false} : state;
  if (action === 'toggle' || action === 'close') {
    const open = action === 'toggle' ? !state.open : false;
    return {...state, open, desktopOpen: state.mobile ? state.desktopOpen : open};
  }
  return state;
}

function installDirectoryNavigation() {
  if (window.__knowledgeDirectoryNavigation) return;
  window.__knowledgeDirectoryNavigation = true;
  const media = window.matchMedia('(max-width: 900px)');
  let state = directoryState(null, 'init', media.matches);
  let cleanup = () => {};
  const connect = () => {
    cleanup();
    state = directoryState(state, 'navigate');
    state = directoryState(state, 'resize', media.matches);
    const sidebar = document.querySelector('.sidebar.left');
    const toggle = document.querySelector('[data-directory-toggle]');
    const center = document.querySelector('#quartz-body > .center');
    const explorer = sidebar?.querySelector('.explorer');
    if (!sidebar || !toggle || !explorer) return;
    sidebar.id = 'kb-directory';
    explorer.classList.remove('collapsed');
    explorer.querySelector('.explorer-content')?.setAttribute('aria-expanded', 'true');
    let heading = sidebar.querySelector('.kb-drawer-head');
    if (!heading) {
      heading = document.createElement('div');
      heading.className = 'kb-drawer-head';
      const title = document.createElement('a');
      title.href = '/knowledge/';
      title.className = 'internal';
      title.textContent = '知识目录';
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'kb-directory-close';
      close.setAttribute('data-directory-close', '');
      close.setAttribute('aria-label', '关闭目录');
      close.textContent = '×';
      heading.append(title, close);
      sidebar.prepend(heading);
    }
    let backdrop = document.querySelector('[data-directory-backdrop]');
    if (!backdrop) {
      backdrop = document.createElement('button');
      backdrop.type = 'button';
      backdrop.className = 'kb-directory-backdrop';
      backdrop.setAttribute('data-directory-backdrop', '');
      backdrop.setAttribute('aria-label', '关闭目录');
      backdrop.tabIndex = -1;
      document.body.append(backdrop);
    }
    const tools = document.querySelector('.kb-tools');
    const listeners = [];
    const on = (target, type, fn, options = false) => {
      target.addEventListener(type, fn, options);
      listeners.push(() => target.removeEventListener(type, fn, options));
    };
    const paint = () => {
      const drawer = state.mobile && state.open;
      document.body.classList.toggle('kb-directory-open', state.open);
      document.body.classList.toggle('kb-directory-collapsed', !state.open);
      document.documentElement.classList.toggle('kb-scroll-locked', drawer);
      document.documentElement.classList.remove('mobile-no-scroll');
      document.querySelector('#quartz-body')?.classList.remove('lock-scroll');
      sidebar.inert = !state.open;
      sidebar.setAttribute('aria-hidden', String(!state.open));
      sidebar.setAttribute('role', state.mobile ? 'dialog' : 'navigation');
      sidebar.setAttribute('aria-label', '知识目录');
      if (drawer) sidebar.setAttribute('aria-modal', 'true'); else sidebar.removeAttribute('aria-modal');
      if (center) center.inert = drawer;
      backdrop.hidden = !drawer;
      toggle.setAttribute('aria-expanded', String(state.open));
      toggle.setAttribute('aria-controls', sidebar.id);
      toggle.setAttribute('aria-label', state.open ? '关闭目录' : '打开目录');
      toggle.setAttribute('title', state.open ? '关闭目录' : '打开目录');
    };
    const dispatch = (action, focus = false) => {
      state = directoryState(state, action, media.matches);
      paint();
      if (focus) toggle.focus();
    };
    on(toggle, 'click', () => {
      dispatch('toggle');
      if (state.mobile && state.open) heading.querySelector('button').focus();
    });
    on(heading.querySelector('button'), 'click', () => dispatch('close', true));
    on(backdrop, 'click', () => dispatch('close', true));
    on(sidebar, 'click', event => {
      if (state.mobile && event.target.closest('a')) dispatch('navigate', true);
    });
    on(document, 'keydown', event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        if (state.mobile && state.open) dispatch('close');
        if (tools) tools.open = false;
      }
      if (event.key === 'Escape') {
        if (state.mobile && state.open) { event.preventDefault(); dispatch('close', true); }
        if (tools?.open) { tools.open = false; tools.querySelector('summary')?.focus(); }
      }
      if (event.key === 'Tab' && state.mobile && state.open) {
        const focusable = [...sidebar.querySelectorAll('a[href], button, [tabindex="0"]')].filter(node => !node.disabled && node.getClientRects().length);
        const first = focusable[0], last = focusable.at(-1);
        if (event.shiftKey && (document.activeElement === first || !sidebar.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }, true);
    const searchButton = document.querySelector('.search-button');
    if (searchButton) on(searchButton, 'click', () => { if (state.mobile && state.open) dispatch('close'); }, true);
    on(document, 'click', event => { if (tools?.open && !tools.contains(event.target)) tools.open = false; });
    on(media, 'change', () => {
      const wasDrawer = state.mobile && state.open;
      dispatch('resize');
      if (wasDrawer) toggle.focus();
      if (tools) tools.open = false;
    });
    paint();
    cleanup = () => {
      listeners.forEach(remove => remove());
      if (center) center.inert = false;
      document.documentElement.classList.remove('kb-scroll-locked', 'mobile-no-scroll');
      backdrop.hidden = true;
      if (tools) tools.open = false;
    };
  };
  document.addEventListener('nav', connect);
  document.addEventListener('render', connect);
  document.addEventListener('prenav', () => {
    state = directoryState(state, 'navigate');
    cleanup();
  });
  if (document.readyState !== 'loading') connect();
  else document.addEventListener('DOMContentLoaded', connect, {once: true});
}

export const navigationBridge = `(() => { ${directoryState.toString()} (${installDirectoryNavigation.toString()})(); })();`;
