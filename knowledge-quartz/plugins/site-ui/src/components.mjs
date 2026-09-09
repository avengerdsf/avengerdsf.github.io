import { h } from 'preact';
import { notebookData, sourceFor, newNoteUrl, noteHref } from './data.mjs';
import { themeBridge } from './theme.mjs';

const external = {target: '_blank', rel: 'noopener noreferrer', 'data-no-popover': true};
const arrow = () => h('span', {'aria-hidden': 'true'}, '↗');

export function KnowledgeBrand() {
  const Brand = () => h('a', {class: 'kb-brand', href: '/', 'data-router-ignore': true, 'aria-label': 'Chenyinhong，返回主页'},
    h('img', {src: 'https://avatars.githubusercontent.com/u/119413549?v=4', width: 34, height: 34, alt: ''}),
    h('span', null, 'Chenyinhong'),
  );
  Brand.beforeDOMLoaded = themeBridge;
  return Brand;
}

export function KnowledgeActions() {
  return ({fileData}) => {
    const source = sourceFor(fileData);
    return h('nav', {class: 'kb-actions', 'aria-label': '知识库操作'},
      h('a', {class: 'kb-home-link', href: '/', 'data-router-ignore': true}, '主页'),
      source && fileData.slug !== 'index' && h('a', {...external, class: 'kb-edit-link', href: source.editUrl, title: '在 GitHub 编辑这篇笔记的原始 Markdown'}, '编辑本文', arrow()),
      h('a', {...external, class: 'kb-new-note', href: newNoteUrl(fileData), title: '在 GitHub 新建 Markdown 笔记；提交后自动发布'}, h('span', {'aria-hidden': 'true'}, '+'), '新增笔记'),
    );
  };
}

export function KnowledgeOverview() {
  return ({fileData, allFiles}) => {
    if (fileData.slug !== 'index') return null;
    const {notes, groups} = notebookData(allFiles);
    return h('section', {class: 'kb-overview', 'aria-label': '笔记目录'},
      h('p', {class: 'kb-overview-meta'}, `${groups.length} 个目录 · ${notes.length} 篇笔记`),
      groups.length ? h('div', {class: 'kb-notebooks'}, groups.map(group => h('section', {class: 'kb-notebook', key: group.slug},
        h('div', {class: 'kb-notebook-heading'},
          h('span', {class: 'kb-book-icon', 'aria-hidden': 'true'}, h('svg', {viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', 'stroke-width':'1.7'}, h('path',{d:'M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2V5Zm0 13h15M8 3v15'}))),
          h('h2', null, group.slug ? h('a', {class:'internal', href:noteHref(`${group.slug}/index`)}, group.title) : group.title),
          h('span', {class: 'kb-note-count'}, `${group.notes.length} 篇`),
        ),
        h('ul', {class: 'kb-note-preview'}, group.notes.slice(0, 4).map(note => h('li', {key: note.slug},
          h('a', {class: 'internal', href: noteHref(note.slug)}, note.title, h('span', {'aria-hidden': 'true'}, '→')),
        ))),
        group.slug && h('a', {class: 'kb-browse internal', href:noteHref(`${group.slug}/index`)}, '查看目录', h('span', {'aria-hidden': 'true'}, '→')),
      ))) : h('p', {class:'kb-empty'}, '还没有笔记。点击“新增笔记”开始记录。'),
      notes.length > 0 && h('details', {class: 'kb-all-notes'},
        h('summary', null, '全部笔记', h('span', null, String(notes.length))),
        h('ul', {class: 'kb-note-list'}, notes.map(note => h('li', {key: note.slug},
          h('a', {class:'internal', href:noteHref(note.slug)}, note.title),
          h('span', null, groups.find(group => group.slug === note.group)?.title),
        ))),
      ),
    );
  };
}
