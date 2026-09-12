import { h } from 'preact';
import { sourceFor, newNoteUrl, noteHref } from './data.mjs';
import { directoryContents, parentDirectoryHref } from './navigation.mjs';
import { themeBridge } from './theme.mjs';

const external = {target: '_blank', rel: 'noopener noreferrer', 'data-no-popover': true};
const arrow = () => h('span', {'aria-hidden': 'true'}, '↗');
const folderIcon = () => h('svg', {viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.6', 'aria-hidden': 'true'},
  h('path', {d: 'M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z'}),
);

export function KnowledgeBrand() {
  const Brand = () => h('a', {class: 'kb-brand', href: '/', 'data-router-ignore': true, 'aria-label': 'Chenyinhong，返回主页'},
    h('img', {src: 'https://avatars.githubusercontent.com/u/119413549?v=4', width: 34, height: 34, alt: ''}),
    h('span', null, 'Chenyinhong'),
  );
  Brand.beforeDOMLoaded = themeBridge;
  return Brand;
}

export function KnowledgeActions() {
  return ({fileData, allFiles}) => {
    const source = sourceFor(fileData);
    const parent = parentDirectoryHref(fileData.slug);
    const isDirectory = fileData.slug === 'index' || fileData.slug?.endsWith('/index');
    return h('nav', {class: 'kb-actions', 'aria-label': '知识库操作'},
      h('a', {class: 'kb-home-link', href: '/', 'data-router-ignore': true}, '← 返回主页'),
      parent && h('a', {class: 'kb-up-link internal', href: parent, title: '返回上一级目录'}, '↑ 上一级'),
      source && fileData.slug !== 'index' && h('a', {...external, class: 'kb-edit-link', href: source.editUrl}, isDirectory ? '编辑目录' : '编辑本文', arrow()),
      h('a', {...external, class: 'kb-new-note', href: newNoteUrl(fileData, allFiles), title: '在当前目录新建 Markdown 笔记'}, h('span', {'aria-hidden': 'true'}, '+'), '新增笔记'),
    );
  };
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
          h('span', {class: 'kb-directory-label'}, h('strong', null, directory.title.replace(/(?:学习)?笔记$/, '') || directory.title)),
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
