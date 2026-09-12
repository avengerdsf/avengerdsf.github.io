import { h } from 'preact';
import { notebookData, sourceFor, newNoteUrl, noteHref } from './data.mjs';
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
    if (slug !== 'index' && (!slug?.endsWith('/index') || slug.startsWith('tags/'))) return null;
    const scope = slug === 'index' ? '' : slug.slice(0, -6);
    const {notes, groups} = notebookData(allFiles, scope);

    // Landing: one entry per real top-level directory, with no article previews.
    // Loose root notes remain accessible through the explorer and full-text search.
    if (!scope) {
      const directories = groups.filter(group => group.slug);
      return h('section', {class: 'kb-overview', 'aria-label': '知识目录', 'data-scope': ''},
        h('p', {class: 'kb-overview-meta'}, `${directories.length} 个目录`),
        directories.length ? h('ul', {class: 'kb-notebooks kb-directory-list'}, directories.map(group => h('li', {key: group.slug},
          h('a', {class: 'internal kb-directory-link', href: noteHref(`${group.slug}/index`)},
            h('span', {class: 'kb-directory-icon'}, folderIcon()),
            h('span', {class: 'kb-directory-label'},
              h('strong', null, group.title.replace(/(?:学习)?笔记$/, '') || group.title),
              h('span', {class: 'kb-directory-count'}, `${group.notes.length} 篇笔记`),
            ),
            h('span', {class: 'kb-directory-arrow', 'aria-hidden': 'true'}, '→'),
          ),
        ))) : h('p', {class: 'kb-empty'}, '还没有笔记目录。'),
      );
    }

    // Directory: list its articles directly, including descendants; no second directory layer.
    return h('section', {class: 'kb-overview', 'aria-label': '笔记列表', 'data-scope': scope},
      h('p', {class: 'kb-overview-meta'}, `${notes.length} 篇笔记`),
      notes.length ? h('ul', {class: 'kb-note-list'}, notes.map(note => h('li', {key: note.slug},
        h('a', {class: 'internal kb-note-link', href: noteHref(note.slug)},
          h('span', {class: 'kb-note-title'}, note.title),
          h('span', {class: 'kb-note-arrow', 'aria-hidden': 'true'}, '→'),
        ),
      ))) : h('p', {class: 'kb-empty'}, '此目录还没有笔记。'),
    );
  };
}
