function installSolutionSwitch() {
  if (window.__knowledgeSolutionSwitch) return;
  window.__knowledgeSolutionSwitch = true;
  const activate = (card, id) => {
    const panels = [...card.querySelectorAll('[data-solution-panel]')];
    const selected = panels.find(panel => panel.id === id);
    if (!selected) return null;
    panels.forEach(panel => { panel.hidden = panel !== selected; });
    card.querySelectorAll('[data-solution-choice]').forEach(button => {
      button.setAttribute('aria-pressed',String(button.dataset.solutionChoice === id));
    });
    return selected;
  };
  const showHash = (hash, scroll = false) => {
    let id;
    try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    const panel = target?.closest('[data-solution-panel]');
    const card = document.querySelector('article .kb-solution-card');
    if (!panel || !card?.contains(panel)) return;
    activate(card,panel.id);
    if (scroll) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({block:'start'}));
  };
  document.addEventListener('click',event => {
    const button = event.target.closest('button[data-solution-choice]');
    if (button) {
      const card = button.closest('.kb-solution-card');
      const panel = activate(card,button.dataset.solutionChoice);
      if (!panel) return;
      const url = new URL(window.location.href);
      url.hash = panel.querySelector('h2[id]')?.id || panel.id;
      history.replaceState(history.state,'',url);
      return;
    }
    const link = event.target.closest('a[href]');
    if (!link || link.target === '_blank' || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const url = new URL(link.href);
    if (url.origin === location.origin && url.pathname === location.pathname) showHash(url.hash);
  },true);
  const mount = () => showHash(window.location.hash,true);
  document.addEventListener('nav',mount);
  document.addEventListener('render',mount);
  window.addEventListener('hashchange',mount);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
}

export const solutionSwitchBridge = `(${installSolutionSwitch.toString()})();`;
