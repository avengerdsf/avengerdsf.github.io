/** Directory browsing is distinct from a recursive search result. */
const visible = file => typeof file.filePath === 'string' && /\.md$/i.test(file.filePath)
  && !['draft', 'unlisted'].some(key => [file[key], file.frontmatter?.[key]].some(value => value === true || value === 'true'));
const encodePath = path => path.split('/').map(encodeURIComponent).join('/');
const byTitle = (a, b) => a.title.localeCompare(b.title, 'zh-CN', {numeric:true});

export function directoryContents(files = [], scope = '') {
  const source = files.filter(file => file.slug && visible(file));
  const titles = new Map(source.filter(file => file.slug.endsWith('/index'))
    .map(file => [file.slug.slice(0,-6), String(file.frontmatter?.title || file.slug.split('/').at(-2))]));
  const prefix = scope ? `${scope}/` : '';
  const directories = new Map();
  const notes = [];
  for (const file of source) {
    if (!file.slug.startsWith(prefix)) continue;
    const relative = file.slug.slice(prefix.length);
    if (!relative || relative === 'index') continue;
    if (relative.includes('/')) {
      const segment = relative.split('/')[0];
      const slug = prefix + segment;
      directories.set(slug, {slug, title:titles.get(slug) || segment});
    } else {
      notes.push({slug:file.slug, title:String(file.frontmatter?.title || relative)});
    }
  }
  return {directories:[...directories.values()].sort((a,b) => a.slug.localeCompare(b.slug, 'en', {numeric:true})), notes:notes.sort(byTitle)};
}

export function parentDirectoryHref(slug) {
  if (!slug || slug === 'index') return null;
  const path = slug.endsWith('/index') ? slug.slice(0,-6) : slug;
  const parts = path.split('/');
  parts.pop();
  return `/knowledge/${parts.length ? `${encodePath(parts.join('/'))}/` : ''}`;
}
