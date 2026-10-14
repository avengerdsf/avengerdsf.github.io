export function validFavoriteSlug(slug) {
  return typeof slug === 'string' && slug.startsWith('leetcode/') && slug.split('/').every(part => part && part !== '.' && part !== '..');
}

export function parseFavorites(value) {
  if (!value || value.version !== 1 || !Array.isArray(value.favorites) || !value.favorites.every(validFavoriteSlug)
    || Object.keys(value).some(key => !['version','favorites'].includes(key))) {
    throw Object.assign(new Error('收藏文件格式不受支持，已停止写入。'), {code:'INVALID_DATA'});
  }
  return [...new Set(value.favorites)];
}

export function setFavorite(slugs, slug, wanted) {
  if (!validFavoriteSlug(slug) || typeof wanted !== 'boolean') throw new Error('无效的收藏操作。');
  if (!wanted) return slugs.filter(item => item !== slug);
  return slugs.includes(slug) ? [...slugs] : [slug,...slugs];
}

export function encodeFavorites(slugs) {
  const bytes = new TextEncoder().encode(JSON.stringify({version:1,favorites:slugs},null,2) + '\n');
  return btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''));
}

export function decodeFavorites(file) {
  try {
    if (file.type !== 'file' || file.encoding !== 'base64' || typeof file.sha !== 'string' || !file.sha) throw new Error();
    const bytes = Uint8Array.from(atob(file.content), character => character.charCodeAt(0));
    return {sha:file.sha, favorites:parseFavorites(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)))};
  } catch {
    throw Object.assign(new Error('收藏文件格式不受支持，已停止写入。'), {code:'INVALID_DATA'});
  }
}

export function createGitHubFavoritesStore({token, fetchImpl = globalThis.fetch}) {
  if (typeof token !== 'string' || !token.trim()) throw new Error('请填写 GitHub 访问令牌。');
  const repository = 'https://api.github.com/repos/avengerdsf/knowledge-favorites';
  const fileUrl = `${repository}/contents/favorites.json`;
  const headers = {Accept:'application/vnd.github+json', Authorization:`Bearer ${token.trim()}`, 'X-GitHub-Api-Version':'2022-11-28'};
  let checked = false;
  let queue = Promise.resolve();
  const request = async (url, options = {}) => {
    const response = await fetchImpl(url, {cache:'no-store', redirect:'error', ...options, headers:{...headers,...options.headers}});
    if (!response.ok) throw Object.assign(new Error('GitHub 收藏请求失败。'), {status:response.status});
    return response.json();
  };
  const readFile = async () => {
    if (!checked) {
      const metadata = await request(repository);
      if (metadata.private !== true) throw Object.assign(new Error('收藏仓库需要设为私有。'), {code:'PRIVATE_REQUIRED'});
      checked = true;
    }
    return decodeFavorites(await request(`${fileUrl}?ref=main`));
  };
  const serial = action => {
    const pending = queue.then(action);
    queue = pending.catch(() => {});
    return pending;
  };
  return {
    read: () => serial(async () => (await readFile()).favorites),
    set: (slug, wanted) => serial(async () => {
      if (!validFavoriteSlug(slug) || typeof wanted !== 'boolean') throw new Error('无效的收藏操作。');
      for (let attempt = 0; attempt < 2; attempt++) {
        const current = await readFile();
        const next = setFavorite(current.favorites,slug,wanted);
        if (JSON.stringify(next) === JSON.stringify(current.favorites)) return current.favorites;
        try {
          await request(fileUrl, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({
            message:'Update knowledge favorites', branch:'main', sha:current.sha, content:encodeFavorites(next),
          })});
          return next;
        } catch (error) {
          if (error.status !== 409 || attempt === 1) throw error;
        }
      }
    }),
  };
}
