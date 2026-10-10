import { h } from 'preact';
import { sourceFor, newNoteUrl, noteHref } from './data.mjs';
import { directoryContents, parentDirectoryHref, navigationBridge } from './navigation.mjs';
import { themeBridge } from './theme.mjs';
import { leetcodeProblemNotes, randomBrowseBridge } from './random.mjs';
import { noteSplitBridge } from './note-split.mjs';

const external = {target: '_blank', rel: 'noopener noreferrer', 'data-no-popover': true};
const arrow = () => h('span', {'aria-hidden': 'true'}, '↗');
const folderIcon = () => h('svg', {viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.6', 'aria-hidden': 'true'},
  h('path', {d: 'M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z'}),
);

const documentIcon = () => h('svg', {viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.6', 'aria-hidden': 'true'},
  h('path', {d: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z M14 3v6h6 M8 13h8 M8 17h6'}),
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
  Actions.afterDOMLoaded = `${navigationBridge}\n${noteSplitBridge}`;
  return Actions;
}
export function KnowledgeOverview() {
  const Overview = ({fileData, allFiles}) => {
    const slug = fileData.slug;
    if (slug !== 'index' && (!slug?.endsWith('/index') || slug.startsWith('tags/'))) return null;
    const scope = slug === 'index' ? '' : slug.slice(0, -6);
    const {directories, notes} = directoryContents(allFiles, scope);
    const problems = scope === 'leetcode' ? leetcodeProblemNotes(allFiles) : [];
    // Homepage -> subject -> topic -> individual note. Never flatten descendants.
    return h('section', {class: 'kb-overview', 'aria-label': '知识目录', 'data-scope': scope},
      problems.length > 0 && h('div', {class:'kb-browse-controls', 'aria-label':'题目浏览方式'},
        h('button', {type:'button', 'data-random-toggle':true, 'aria-pressed':false, 'aria-controls':'kb-random-notes'}, '乱序浏览'),
        h('button', {type:'button', 'data-random-refresh':true, hidden:true}, '重新打乱'),
      ),
      directories.length > 0 && h('ul', {class: 'kb-notebooks kb-directory-list kb-entry-list', 'aria-label': scope === 'leetcode' ? '题型目录' : '子目录'}, directories.map(directory => h('li', {key: directory.slug},
        h('a', {class: 'internal kb-directory-link kb-entry-link', href: noteHref(`${directory.slug}/index`), 'aria-label': directory.title, 'data-no-popover':'true'},
          h('span', {class: 'kb-directory-head'},
            h('span', {class: 'kb-directory-icon kb-entry-icon'}, folderIcon()),
            h('span', {class: 'kb-directory-label kb-entry-label'}, h('strong', {class: 'kb-entry-title'}, directory.title)),
            h('span', {class: 'kb-directory-arrow kb-entry-arrow', 'aria-hidden': 'true'}, '→'),
          ),
          directory.previewNotes.length > 0 && h('ul', {class: 'kb-directory-preview', 'aria-label': '笔记名称预览'}, directory.previewNotes.map(note =>
            h('li', {key: note.slug, title: note.title}, note.title),
          )),
        ),
      ))),
      scope && notes.length > 0 && h('ul', {class: 'kb-note-list kb-entry-list', 'aria-label': '笔记'}, notes.map(note => h('li', {key: note.slug},
        h('a', {class: 'internal kb-note-link kb-entry-link', href: noteHref(note.slug)},
          h('span', {class: 'kb-note-icon kb-entry-icon'}, documentIcon()),
          h('span', {class: 'kb-note-title kb-entry-label'}, h('strong', {class: 'kb-entry-title'}, note.title)),
          h('span', {class: 'kb-note-arrow kb-entry-arrow', 'aria-hidden': 'true'}, '→'),
        ),
      ))),
      problems.length > 0 && h('ul', {id:'kb-random-notes', class:'kb-random-notes kb-entry-list', 'data-random-notes':true, 'aria-label':'乱序题目', hidden:true}, problems.map(note => h('li', {key:note.slug, 'data-note-slug':note.slug},
        h('a', {class:'internal kb-random-note-link kb-entry-link', href:noteHref(note.slug), 'data-no-popover':'true'},
          h('span', {class:'kb-note-icon kb-entry-icon'}, documentIcon()),
          h('span', {class:'kb-note-title kb-entry-label'}, h('strong', {class:'kb-entry-title'}, note.title)),
          h('span', {class:'kb-note-arrow kb-entry-arrow', 'aria-hidden':'true'}, '→'),
        ),
      ))),
      !directories.length && (!scope || !notes.length) && h('p', {class:'kb-empty'}, scope ? '此目录还没有笔记。' : '还没有笔记目录。'),
    );
  };
  Overview.afterDOMLoaded = randomBrowseBridge;
  return Overview;
}
