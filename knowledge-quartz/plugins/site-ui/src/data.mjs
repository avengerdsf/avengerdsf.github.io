/** Pure metadata helpers shared by the Quartz components and regression tests. */
export const NOTE_TEMPLATE = '---\ntitle: 新笔记\ntags: []\n---\n\n## 核心思路\n\n\n\n## 正文\n\n';
const SITE = 'avengerdsf/avengerdsf.github.io';
const LEARNING = 'avengerdsf/machine-learning-notes';
const encodePath = (value) => value.split('/').map(encodeURIComponent).join('/');
const isHidden = (file) => ['draft', 'unlisted'].some((key) => [true, 'true'].includes(file.frontmatter?.[key]));
const titleOf = (file) => String(file.frontmatter?.title || file.slug.split('/').at(-1));

export function noteHref(slug) {
  const path = String(slug).replace(/(^|\/)index$/, '$1');
  return `/knowledge/${encodePath(path)}`;
}

export function notebookData(files = []) {
  const visible = files.filter((file) => file.slug && !isHidden(file) && /\.md$/i.test(file.relativePath || file.filePath || ''));
  const titles = new Map(visible.filter((file) => /\/index$/.test(file.slug)).map((file) => [file.slug.slice(0, -6), titleOf(file)]));
  const notes = visible.filter((file) => !/(^|\/)index$/.test(file.slug)).map((file) => ({
    slug: file.slug,
    title: titleOf(file),
    group: file.slug.includes('/') ? file.slug.split('/')[0] : '',
    // Do not label a freshly copied file's build timestamp as an authored update.
    updated: Date.parse(file.frontmatter?.updated || file.frontmatter?.modified || '') || 0,
  })).sort((a, b) => b.updated - a.updated || a.title.localeCompare(b.title, 'zh-CN', {numeric: true}));
  const groups = new Map();
  for (const note of notes) {
    if (!groups.has(note.group)) groups.set(note.group, {slug: note.group, title: titles.get(note.group) || note.group || '未分组', notes: []});
    groups.get(note.group).notes.push(note);
  }
  return {notes, groups: [...groups.values()].sort((a, b) => a.slug.localeCompare(b.slug, 'en'))};
}

export function sourceFor(file = {}) {
  // Slugs are normalized URLs, not source filenames. Never reconstruct edit paths from them.
  const relative = String(file.relativePath || '').replaceAll('\\', '/');
  if (!relative || !/\.md$/i.test(relative) || relative.startsWith('/') || relative.split('/').some(part => part === '..')) return null;
  const synced = relative.startsWith('machine-learning/');
  const repository = synced ? LEARNING : SITE;
  let path = synced ? relative.slice('machine-learning/'.length) : `knowledge/${relative}`;
  if (synced && path === 'index.md') path = 'README.md';
  return {repository, path, editUrl: `https://github.com/${repository}/edit/main/${encodePath(path)}`};
}

export function newNoteUrl(file = {}) {
  const source = sourceFor(file);
  const repository = source?.repository || SITE;
  const folder = source ? source.path.split('/').slice(0, -1).join('/') : 'knowledge';
  const params = new URLSearchParams({filename: `${folder ? `${folder}/` : ''}新笔记.md`, value: NOTE_TEMPLATE});
  return `https://github.com/${repository}/new/main?${params}`;
}
