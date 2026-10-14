import { validFavoriteSlug, parseFavorites, setFavorite, encodeFavorites, decodeFavorites, createGitHubFavoritesStore } from './favorites-store.mjs';

function installFavorites() {
  if (window.__knowledgeFavorites) return;
  const sessionKey = 'avengerdsf-favorites-session';
  const deviceKey = 'avengerdsf-favorites-device';
  const logoutKey = 'avengerdsf-favorites-logout';
  let store = null;
  let restored = false;
  let generation = 0;
  let pendingSlug = null;
  let trigger = null;
  const state = {items:[], connected:false, loading:false, busy:false, busySlug:null, message:''};
  const snapshot = () => ({...state, items:[...state.items]});
  const savedCredentials = () => {
    try {
      const session = sessionStorage.getItem(sessionKey);
      const device = localStorage.getItem(deviceKey);
      return session || device ? {token:session || device,remember:!session} : null;
    } catch { return null; }
  };
  const errorText = error => {
    if (error.code === 'INVALID_DATA') return '收藏文件格式异常，已停止写入。';
    if (error.code === 'PRIVATE_REQUIRED') return '收藏仓库需要设为私有。';
    if (error.status === 401) return 'GitHub 授权已失效，请更新令牌。';
    if (error.status === 403) return 'GitHub 拒绝了请求，请检查收藏仓库的 Contents 读写权限。';
    if (error.status === 404) return '无法读取私有收藏文件，请检查仓库、文件和授权范围。';
    if (error.status === 409) return '其他设备正在更新收藏，请刷新后重试。';
    return '暂时无法确认收藏状态，请刷新后重试。';
  };
  const dialog = () => document.querySelector('[data-favorites-dialog]');
  const paint = () => {
    document.querySelectorAll('[data-favorite-note]').forEach(button => {
      const slug = button.dataset.favoriteNote;
      const selected = state.connected && state.items.includes(slug);
      button.textContent = state.busySlug === slug ? '保存中…' : state.loading ? '加载中…' : selected ? '★ 已收藏' : '☆ 收藏';
      button.setAttribute('aria-pressed',String(selected));
      button.setAttribute('aria-label',selected ? '取消收藏本题' : '收藏本题');
      button.disabled = state.busy || state.loading;
    });
    document.querySelectorAll('[data-favorites-message]').forEach(node => {
      node.textContent = state.message;
      node.hidden = !state.message;
    });
    document.querySelectorAll('[data-favorites-settings]').forEach(button => { button.disabled = state.busy; });
    const modal = dialog();
    if (modal) {
      modal.querySelector('[data-favorites-connect]').disabled = state.loading || state.busy;
      modal.querySelector('[data-favorites-disconnect]').hidden = !state.connected && !savedCredentials();
    }
  };
  const notify = () => {
    paint();
    document.dispatchEvent(new CustomEvent('knowledge:favorites-change'));
  };
  const clearCredentials = () => {
    try { sessionStorage.removeItem(sessionKey); localStorage.removeItem(deviceKey); } catch {}
  };
  const disconnect = (broadcast = true) => {
    generation += 1;
    store = null;
    pendingSlug = null;
    clearCredentials();
    Object.assign(state,{items:[],connected:false,loading:false,busy:false,busySlug:null,message:''});
    notify();
    if (broadcast) {
      try { localStorage.setItem(logoutKey,`${Date.now()}:${Math.random()}`); } catch {}
    }
  };
  const refresh = async () => {
    if (state.busy || state.loading) return;
    if (!store) {
      const saved = savedCredentials();
      if (saved) await connect(saved.token,saved.remember);
      return;
    }
    const activeStore = store;
    const version = ++generation;
    state.loading = true;
    notify();
    try {
      const items = await activeStore.read();
      if (version === generation && store === activeStore) Object.assign(state,{items,message:''});
    } catch (error) {
      if (version === generation) state.message = errorText(error);
    } finally {
      if (version === generation) { state.loading = false; notify(); }
    }
  };
  const change = async (slug, wanted) => {
    if (!store || state.busy || state.loading) return;
    const activeStore = store;
    const version = ++generation;
    Object.assign(state,{busy:true,busySlug:slug,message:''});
    notify();
    try {
      const items = await activeStore.set(slug,wanted);
      if (version === generation && store === activeStore) state.items = items;
    } catch (error) {
      if (version === generation) state.message = errorText(error);
    } finally {
      if (version === generation) { state.busy = false; state.busySlug = null; notify(); }
    }
  };
  const openSettings = (slug = null, source = null) => {
    const modal = dialog();
    if (!modal || state.busy) return;
    pendingSlug = slug;
    trigger = source;
    modal.querySelector('form').reset();
    modal.querySelector('[data-favorites-message]').textContent = '';
    modal.querySelector('[data-favorites-message]').hidden = true;
    modal.showModal();
    modal.querySelector('[data-favorites-token]').focus();
  };
  const connect = async (token, remember) => {
    const version = ++generation;
    Object.assign(state,{loading:true,message:''});
    notify();
    try {
      const candidate = createGitHubFavoritesStore({token});
      const items = await candidate.read();
      if (version !== generation) return;
      store = candidate;
      Object.assign(state,{items,connected:true,loading:false});
      clearCredentials();
      try { (remember ? localStorage : sessionStorage).setItem(remember ? deviceKey : sessionKey,token.trim()); }
      catch { state.message = '已连接，但此浏览器无法保存授权。'; }
      const slug = pendingSlug;
      pendingSlug = null;
      const modal = dialog();
      if (modal) { modal.querySelector('[data-favorites-token]').value = ''; if (modal.open) modal.close(); }
      notify();
      if (slug) await change(slug,true);
    } catch (error) {
      if (version === generation) state.message = errorText(error);
    } finally {
      if (version === generation) { state.loading = false; notify(); }
    }
  };
  window.__knowledgeFavorites = {getState:snapshot, refresh, openSettings};
  document.addEventListener('click',event => {
    const note = event.target.closest('[data-favorite-note]');
    if (note) {
      if (!state.connected) openSettings(note.dataset.favoriteNote,note);
      else void change(note.dataset.favoriteNote,!state.items.includes(note.dataset.favoriteNote));
    }
    const settings = event.target.closest('[data-favorites-settings]');
    if (settings) openSettings(null,settings);
    if (event.target.closest('[data-favorites-refresh]')) void refresh();
    if (event.target.closest('[data-favorites-close]')) dialog()?.close();
    if (event.target.closest('[data-favorites-disconnect]')) { disconnect(); dialog()?.close(); }
  });
  document.addEventListener('submit',event => {
    if (!event.target.matches('[data-favorites-form]')) return;
    event.preventDefault();
    const modal = dialog();
    void connect(modal.querySelector('[data-favorites-token]').value,modal.querySelector('[data-favorites-remember]').checked);
  });
  document.addEventListener('close',event => {
    if (!event.target.matches('[data-favorites-dialog]')) return;
    if (state.loading) { generation += 1; state.loading = false; notify(); }
    pendingSlug = null;
    event.target.querySelector('[data-favorites-token]').value = '';
    if (trigger?.isConnected) trigger.focus();
    trigger = null;
  },true);
  const mount = () => {
    if (!document.querySelector('[data-favorite-note], [data-favorites-toggle]')) return;
    paint();
    if (!restored) {
      restored = true;
      void refresh();
    } else if (state.connected) void refresh();
  };
  document.addEventListener('nav',mount);
  document.addEventListener('render',mount);
  window.addEventListener('focus',() => {
    if (document.querySelector('[data-favorite-note], [data-favorites-toggle]')) void refresh();
  });
  window.addEventListener('storage',event => {
    if (event.key !== logoutKey || event.storageArea !== localStorage) return;
    disconnect(false);
    dialog()?.close();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
}

export const favoritesBridge = `(() => { ${[validFavoriteSlug,parseFavorites,setFavorite,encodeFavorites,decodeFavorites,createGitHubFavoritesStore].map(fn => fn.toString()).join('\n')} (${installFavorites.toString()})(); })();`;
