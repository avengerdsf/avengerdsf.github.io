import { h } from 'preact';
import { sourceFor, newNoteUrl, noteHref } from './data.mjs';
import { directoryContents, parentDirectoryHref, navigationBridge } from './navigation.mjs';
import { themeBridge } from './theme.mjs';

const external = {target: '_blank', rel: 'noopener noreferrer', 'data-no-popover': true};
const arrow = () => h('span', {'aria-hidden': 'true'}, '↗');
const folderIcon = () => h('svg', {viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.6', 'aria-hidden': 'true'},
  h('path', {d: 'M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z'}),
);

export function KnowledgeBrand() {
  const Brand = () => h('a', {class: 'kb-brand kb-home-link', href: '/', 'data-router-ignore': true, 'aria-label': 'Chenyinhong，返回主页'},
    h('img', {src: 'https://avatars.githubusercontent.com/u/119413549?v=4', width: 34, height: 34, alt: ''}),
    h('span', null, 'Chenyinhong'),
  );
  Brand.beforeDOMLoaded = themeBridge;
  return Brand;
}

export function KnowledgeActions() {
  const Actions = ({fileData, allFiles}) => {
    const source = sourceFor(fileData);
    const parent = parentDirectoryHref(fileData.slug);
    const isDirectory = fileData.slug === 'index' || fileData.slug?.endsWith('/index');
    return h('nav', {class: 'kb-actions', 'aria-label': '知识库操作'},
      h('button', {class: 'kb-directory-toggle', type: 'button', 'data-directory-toggle': true, 'aria-label': '打开目录', 'aria-expanded': false, 'aria-controls': 'kb-directory'},
        h('svg', {viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'aria-hidden': true}, h('path', {d: 'M4 5h16M4 12h16M4 19h16'})),
      ),
      h('details', {class: 'kb-tools'},
        h('summary', {class: 'kb-tools-toggle', 'aria-label': '更多操作', title: '更多操作'},
          h('svg', {viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': true}, ...[5,12,19].map(cx => h('circle', {cx, cy: 12, r: 1.7}))),
        ),
        h('div', {class: 'kb-tools-menu'},
          parent && h('a', {class: 'internal kb-root-link', href: '/knowledge/'}, '知识库'),
          parent && parent !== '/knowledge/' && h('a', {class: 'kb-up-link internal', href: parent, title: '返回上一级目录'}, '↑ 上一级'),
          source && fileData.slug !== 'index' && h('a', {...external, class: 'kb-edit-link', href: source.editUrl}, isDirectory ? '编辑目录' : '编辑本文', arrow()),
          h('a', {...external, class: 'kb-new-note', href: newNoteUrl(fileData, allFiles), title: '在当前目录新建 Markdown 笔记'}, '+ 新增笔记'),
        ),
      ),
    );
  };
  Actions.afterDOMLoaded = navigationBridge;
  return Actions;
}
export function KnowledgeOverview() {
  return ({fileData, allFiles}) => {
    const slug = fileData.slug;
    if (slug !== 'index' && (!slug?.endsWith('/index') || slug.startsWith('tags/'))) return null;
    const scope = slug === 'index' ? '' : slug.slice(0, -6);
    const {directories, notes} = directoryContents(allFiles, scope);
    // Homepage -> subject -> topic -> individual note. Never flatten descendants.
    return h('section', {class: 'kb-overview', 'aria-label': '知识目录', 'data-scope': scope},
      directories.length > 0 && h('ul', {class: 'kb-notebooks kb-directory-list', 'aria-label': scope === 'leetcode' ? '题型目录' : '子目录'}, directories.map(directory => h('li', {key: directory.slug},
        h('a', {class: 'internal kb-directory-link', href: noteHref(`${directory.slug}/index`)},
          h('span', {class: 'kb-directory-icon'}, folderIcon()),
          h('span', {class: 'kb-directory-label'}, h('strong', null, directory.title)),
          h('span', {class: 'kb-directory-arrow', 'aria-hidden': 'true'}, '→'),
        ),
      ))),
      scope && notes.length > 0 && h('ul', {class: 'kb-note-list', 'aria-label': '笔记'}, notes.map(note => h('li', {key: note.slug},
        h('a', {class: 'internal kb-note-link', href: noteHref(note.slug)},
          h('span', {class: 'kb-note-title'}, note.title),
          h('span', {class: 'kb-note-arrow', 'aria-hidden': 'true'}, '→'),
        ),
      ))),
      !directories.length && (!scope || !notes.length) && h('p', {class:'kb-empty'}, scope ? '此目录还没有笔记。' : '还没有笔记目录。'),
    );
  };
}
