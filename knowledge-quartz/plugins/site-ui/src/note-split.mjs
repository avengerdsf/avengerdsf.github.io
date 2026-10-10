export function splitWidths(width, ratio = 0.44) {
  if (width < 1100) return null;
  const available = width - 24;
  const preferred = Number.isFinite(ratio) ? ratio : 0.44;
  const left = Math.max(420, Math.min(available - 520, available * preferred));
  return {left, right: available - left, min: 420 / available, max: (available - 520) / available};
}

function installNoteSplit() {
  if (window.__knowledgeNoteSplit) return;
  window.__knowledgeNoteSplit = true;
  const key = 'avengerdsf-note-split';
  let ratio = 0.44;
  try {
    const saved = localStorage.getItem(key);
    const value = Number(saved);
    if (saved !== null && Number.isFinite(value) && value >= 0 && value <= 1) ratio = value;
  } catch {}
  const save = () => { try { localStorage.setItem(key, String(ratio)); } catch {} };
  let cleanup = () => {};
  const connect = () => {
    cleanup();
    const layout = document.querySelector('.page > #quartz-body > .center > article > .markdown-preview-view');
    const handle = layout?.querySelector(':scope > .kb-note-splitter');
    if (!handle) return;
    let pointer = null;
    let offset = 0;
    const stop = (persist = false) => {
      if (pointer === null) return;
      const id = pointer;
      pointer = null;
      if (handle.hasPointerCapture(id)) handle.releasePointerCapture(id);
      delete handle.dataset.dragging;
      document.body.classList.remove('kb-note-resizing');
      if (persist) save();
    };
    const paint = () => {
      const width = layout.getBoundingClientRect().width;
      const sizes = splitWidths(width, ratio);
      if (!sizes) {
        stop();
        layout.style.removeProperty('--kb-problem-width');
        return;
      }
      layout.style.setProperty('--kb-problem-width', `${sizes.left}px`);
      handle.setAttribute('aria-valuemin', String(Math.round(sizes.min * 100)));
      handle.setAttribute('aria-valuemax', String(Math.round(sizes.max * 100)));
      handle.setAttribute('aria-valuenow', String(Math.round(sizes.left / (width - 24) * 100)));
      handle.setAttribute('aria-valuetext', `题目 ${Math.round(sizes.left)} 像素，思路与代码 ${Math.round(sizes.right)} 像素`);
    };
    const handlers = {
      pointerdown: event => {
        const rect = layout.getBoundingClientRect();
        const sizes = splitWidths(rect.width, ratio);
        if (event.button !== 0 || !sizes) return;
        event.preventDefault();
        handle.focus({preventScroll: true});
        pointer = event.pointerId;
        offset = event.clientX - rect.left - sizes.left;
        handle.setPointerCapture(pointer);
        handle.dataset.dragging = 'true';
        document.body.classList.add('kb-note-resizing');
      },
      pointermove: event => {
        if (pointer !== event.pointerId) return;
        const rect = layout.getBoundingClientRect();
        const sizes = splitWidths(rect.width, (event.clientX - rect.left - offset) / (rect.width - 24));
        if (!sizes) return;
        ratio = sizes.left / (rect.width - 24);
        paint();
      },
      pointerup: () => stop(true),
      pointercancel: () => stop(),
      lostpointercapture: () => stop(),
      keydown: event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        const width = layout.getBoundingClientRect().width;
        const sizes = splitWidths(width, ratio);
        if (!sizes) return;
        event.preventDefault();
        const step = event.shiftKey ? 50 : 20;
        const wanted = event.key === 'Home' ? 0 : event.key === 'End' ? width : sizes.left + (event.key === 'ArrowLeft' ? -step : step);
        ratio = splitWidths(width, wanted / (width - 24)).left / (width - 24);
        paint();
        save();
      },
      dblclick: () => { ratio = 0.44; paint(); save(); },
    };
    for (const [type, handler] of Object.entries(handlers)) handle.addEventListener(type, handler);
    let previousWidth = 0;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width === previousWidth) return;
      previousWidth = entry.contentRect.width;
      paint();
    });
    observer.observe(layout);
    paint();
    cleanup = () => {
      stop();
      observer.disconnect();
      for (const [type, handler] of Object.entries(handlers)) handle.removeEventListener(type, handler);
    };
  };
  document.addEventListener('nav', connect);
  document.addEventListener('render', connect);
  document.addEventListener('prenav', () => cleanup());
  if (document.readyState !== 'loading') connect();
  else document.addEventListener('DOMContentLoaded', connect, {once: true});
}

export const noteSplitBridge = `(() => { ${splitWidths.toString()} (${installNoteSplit.toString()})(); })();`;
