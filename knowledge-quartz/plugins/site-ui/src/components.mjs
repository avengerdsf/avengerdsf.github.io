import { h } from 'preact';
import { sourceFor, newNoteUrl, noteHref } from './data.mjs';
import { directoryContents, parentDirectoryHref, navigationBridge } from './navigation.mjs';
import { themeBridge } from './theme.mjs';
import { leetcodeProblemNotes, randomBrowseBridge } from './random.mjs';
import { noteSplitBridge } from './note-split.mjs';
import { favoritesBridge } from './favorites.mjs';

const external = {target: '_blank', rel: 'noopener noreferrer', 'data-no-popover': true};
const arrow = () => h('span', {'aria-hidden': 'true'}, '↗');
const folderIcon = () => h('svg', {viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.6', 'aria-hidden': 'true'},
  h('path', {d: 'M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z'}),
);

const documentIcon = () => h('svg', {viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.6', 'aria-hidden': 'true'},
  h('path', {d: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z M14 3v6h6 M8 13h8 M8 17h6'}),
);
const favoritesDialog = () => h('dialog', {class:'kb-favorites-dialog', 'data-favorites-dialog':true, 'aria-labelledby':'kb-favorites-dialog-title'},
  h('form', {'data-favorites-form':true, method:'dialog'},
    h('div', {class:'kb-favorites-heading'}, h('h2', {id:'kb-favorites-dialog-title'}, 'GitHub 收藏授权'), h('button', {type:'button','data-favorites-close':true,'aria-label':'关闭授权窗口'}, '×')),
    h('p', null, '只选择私有仓库 knowledge-favorites，并开启 Contents 读写权限。'),
    h('a', {href:'https://github.com/settings/personal-access-tokens/new',...external}, '创建受限访问令牌'),
    h('label', {for:'kb-favorites-token'}, 'GitHub 访问令牌'),
    h('input', {id:'kb-favorites-token',type:'password',autocomplete:'off',spellcheck:false,required:true,'data-favorites-token':true}),
    h('label', {class:'kb-favorites-remember'}, h('input', {type:'checkbox','data-favorites-remember':true}), '记住此设备'),
    h('p', {role:'status','data-favorites-message':true,hidden:true}),
    h('div', {class:'kb-favorites-dialog-actions'},
      h('button', {type:'button','data-favorites-disconnect':true,hidden:true}, '退出本设备授权'),
      h('button', {type:'submit','data-favorites-connect':true}, '连接 GitHub'),
    ),
  ),
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
    if (slug !== 'index' && !slug?.endsWith('/index')) {
      const problems = slug?.startsWith('leetcode/') ? leetcodeProblemNotes(allFiles) : [];
      if (!problems.some(note => note.slug === slug)) return null;
      return h('div', {class:'kb-note-browse'},
        h('nav', {class:'kb-random-navigation', 'data-random-navigation':true, 'data-note-slug':slug, 'data-random-links':JSON.stringify(Object.fromEntries(problems.map(note => [note.slug, noteHref(note.slug)]))), 'aria-label':'题目操作'},
        h('span', {class:'kb-random-progress', 'data-random-progress':true,hidden:true}),
        h('button', {type:'button','data-favorite-note':slug,'aria-pressed':false}, '☆ 收藏'),
        h('a', {class:'internal',href:'/knowledge/leetcode/?browse=favorites','data-favorites-return':true,'data-no-popover':'true',hidden:true},'返回收藏夹'),
        h('a', {class:'internal', href:'/knowledge/leetcode/?browse=random', 'data-random-return':true, 'data-no-popover':'true',hidden:true}, '返回乱序列表'),
        h('a', {class:'internal kb-random-next', 'data-random-next':true, 'data-no-popover':'true', hidden:true}, '下一题 →'),
        h('span', {class:'kb-random-end', 'data-random-end':true, hidden:true}, '已到最后一题'),
        ),
        h('p', {class:'kb-favorites-message',role:'status','data-favorites-message':true,hidden:true}),
        favoritesDialog(),
      );
    }
    if (slug?.startsWith('tags/')) return null;
    const scope = slug === 'index' ? '' : slug.slice(0, -6);
    const {directories, notes} = directoryContents(allFiles, scope);
    const problems = scope === 'leetcode' ? leetcodeProblemNotes(allFiles) : [];
    // Homepage -> subject -> topic -> individual note. Never flatten descendants.
    return h('section', {class: 'kb-overview', 'aria-label': '知识目录', 'data-scope': scope},
      problems.length > 0 && h('div', {class:'kb-browse-controls', 'aria-label':'题目浏览方式'},
        h('button', {type:'button', 'data-random-toggle':true, 'aria-pressed':false, 'aria-controls':'kb-random-notes'}, '乱序浏览'),
        h('button', {type:'button', 'data-random-refresh':true, hidden:true}, '重新打乱'),
        h('button', {type:'button','data-favorites-toggle':true,'aria-pressed':false,'aria-controls':'kb-favorite-notes'}, '收藏夹'),
      ),
      problems.length > 0 && h('section', {class:'kb-favorites-panel','data-favorites-panel':true,hidden:true},
        h('div', {class:'kb-favorites-heading'}, h('h2',null,'收藏夹'),
          h('div', null, h('button',{type:'button','data-favorites-refresh':true},'刷新收藏'),h('button',{type:'button','data-favorites-settings':true},'GitHub 授权')),
        ),
        h('p', {role:'status','data-favorites-status':true},'连接 GitHub 后查看收藏。'),
        h('ul', {id:'kb-favorite-notes',class:'kb-entry-list','data-favorite-notes':true,'aria-label':'收藏题目'}),
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
        h('a', {class:'internal kb-random-note-link kb-entry-link', href:`${noteHref(note.slug)}?browse=random`, 'data-no-popover':'true'},
          h('span', {class:'kb-note-icon kb-entry-icon'}, documentIcon()),
          h('span', {class:'kb-note-title kb-entry-label'}, h('strong', {class:'kb-entry-title'}, note.title)),
          h('span', {class:'kb-note-arrow kb-entry-arrow', 'aria-hidden':'true'}, '→'),
        ),
      ))),
      !directories.length && (!scope || !notes.length) && h('p', {class:'kb-empty'}, scope ? '此目录还没有笔记。' : '还没有笔记目录。'),
      problems.length > 0 && favoritesDialog(),
    );
  };
  Overview.afterDOMLoaded = `${favoritesBridge}\n${randomBrowseBridge}`;
  return Overview;
}
