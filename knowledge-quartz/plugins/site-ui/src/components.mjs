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
  return ({fileData, allFiles}) => {
    const source = sourceFor(fileData);
    return h('nav', {class: 'kb-actions', 'aria-label': '知识库操作'},
      h('a', {class: 'kb-home-link', href: '/', 'data-router-ignore': true}, '← 返回主页'),
      source && fileData.slug !== 'index' && h('a', {...external, class: 'kb-edit-link', href: source.editUrl, title: '在 GitHub 编辑这篇笔记的原始 Markdown'}, '编辑本文', arrow()),
      h('a', {...external, class: 'kb-new-note', href: newNoteUrl(fileData, allFiles), title: '在 GitHub 新建 Markdown 笔记；提交后自动发布'}, h('span', {'aria-hidden': 'true'}, '+'), '新增笔记'),
    );
  };
}

export function KnowledgeOverview() {
  return ({fileData, allFiles}) => {
    const slug = fileData.slug;
    // The tree is the only directory navigator. A directory opens a scoped article
    // list, including its descendants, rather than another set of directory cards.
    if (slug !== 'index' && (!slug?.endsWith('/index') || slug.startsWith('tags/'))) return null;
    const scope = slug === 'index' ? '' : slug.slice(0, -6);
    const {notes, groups} = notebookData(allFiles, scope);
    const titles = new Map(groups.map(group => [group.slug, group.title]));
    return h('section', {class: 'kb-overview', 'aria-label': '笔记列表', 'data-scope': scope},
      h('p', {class: 'kb-overview-meta'}, `${notes.length} 篇笔记`),
      notes.length ? h('ul', {class: 'kb-notebooks kb-note-list'}, notes.map(note => h('li', {key: note.slug},
        h('a', {class: 'internal kb-note-link', href: noteHref(note.slug)},
          h('span', {class: 'kb-note-title'}, note.title),
          !scope && h('span', {class: 'kb-note-category'}, titles.get(note.group)),
          h('span', {class: 'kb-note-arrow', 'aria-hidden': 'true'}, '→'),
        ),
      ))) : h('p', {class: 'kb-empty'}, '此目录还没有笔记。'),
    );
  };
}
