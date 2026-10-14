import test from 'node:test';
import assert from 'node:assert/strict';

import * as api from '../src/favorites-store.mjs';
const first = 'leetcode/heap/p4083';
const second = 'leetcode/linked-list/p4044';

function githubFile(initial = [], options = {}) {
  let document = {version:1, favorites:[...initial]};
  let revision = 1;
  let conflicts = options.conflicts || 0;
  const requests = [];
  const response = (value, status = 200) => new Response(JSON.stringify(value), {status, headers:{'Content-Type':'application/json'}});
  const fetchImpl = async (url, init = {}) => {
    const request = {url:String(url), method:init.method || 'GET', headers:new Headers(init.headers), body:init.body && JSON.parse(init.body)};
    requests.push(request);
    assert.equal(request.headers.get('Authorization'), 'Bearer test-token');
    if (String(url) === 'https://api.github.com/repos/avengerdsf/knowledge-favorites') return response({private:options.private !== false});
    const endpoint = new URL(url);
    assert.equal(endpoint.origin + endpoint.pathname, 'https://api.github.com/repos/avengerdsf/knowledge-favorites/contents/favorites.json');
    if (request.method === 'GET') {
      assert.equal(endpoint.searchParams.get('ref'), 'main');
      if (options.readStatus) return response({message:'read refused'}, options.readStatus);
      return response({type:'file', encoding:'base64', sha:String(revision).padStart(40,'0'), content:Buffer.from(JSON.stringify(options.document || document)).toString('base64')});
    }
    assert.equal(request.method, 'PUT');
    assert.equal(request.body.branch, 'main');
    if (options.writeStatus) return response({message:'write refused'}, options.writeStatus);
    if (conflicts > 0) {
      conflicts -= 1;
      document = {version:1, favorites:[first]};
      revision += 1;
      return response({message:'conflict'},409);
    }
    if (request.body.sha !== String(revision).padStart(40,'0')) return response({message:'conflict'},409);
    document = JSON.parse(Buffer.from(request.body.content,'base64').toString('utf8'));
    revision += 1;
    return response({content:{sha:String(revision).padStart(40,'0')}});
  };
  return {fetchImpl, requests, options, get document() { return document; }};
}

test('adding a new favorite puts it first without changing the source list', () => {
  const original = [first];
  assert.deepEqual(api.setFavorite(original,second,true), [second,first]);
  assert.deepEqual(original,[first]);
});

test('repeated additions retain order and removals affect only the selected note', () => {
  assert.deepEqual(api.setFavorite([second,first],first,true),[second,first]);
  assert.deepEqual(api.setFavorite([second,first],second,false),[first]);
  assert.deepEqual(api.setFavorite([first],second,false),[first]);
});

test('valid favorites retain Unicode slugs and normalize duplicate records', () => {
  assert.deepEqual(api.parseFavorites({version:1,favorites:[first,'leetcode/hash-table/两数之和',first]}),[first,'leetcode/hash-table/两数之和']);
});

test('unknown or invalid file formats are rejected instead of overwritten', () => {
  for (const value of [null,{version:2,favorites:[]},{version:1,favorites:'invalid'},{version:1,favorites:[null]},{version:1,favorites:['leetcode/../secret']},{version:1,favorites:[],extra:'keep me'}]) {
    assert.throws(() => api.parseFavorites(value));
  }
});

test('reading favorites uses the authenticated private GitHub file', async () => {
  const remote = githubFile([first]);
  const store = api.createGitHubFavoritesStore({token:'test-token',fetchImpl:remote.fetchImpl});
  assert.deepEqual(await store.read(),[first]);
});

test('saving uses the latest file SHA and never stores credentials in its content', async () => {
  const remote = githubFile([first]);
  const store = api.createGitHubFavoritesStore({token:'test-token',fetchImpl:remote.fetchImpl});
  assert.deepEqual(await store.set(second,true),[second,first]);
  assert.deepEqual(remote.document,{version:1,favorites:[second,first]});
  assert(!JSON.stringify(remote.document).includes('test-token'));
});

test('a conflicting device update is preserved when the operation retries', async () => {
  const remote = githubFile([], {conflicts:1});
  const store = api.createGitHubFavoritesStore({token:'test-token',fetchImpl:remote.fetchImpl});
  assert.deepEqual(await store.set(second,true),[second,first]);
  assert.deepEqual(remote.document.favorites,[second,first]);
});

test('a second conflict is surfaced without repeated or blind writes', async () => {
  const remote = githubFile([], {conflicts:2});
  const store = api.createGitHubFavoritesStore({token:'test-token',fetchImpl:remote.fetchImpl});
  await assert.rejects(async () => store.set(second,true), error => error.status === 409);
  assert.equal(remote.requests.filter(request => request.method === 'PUT').length,2);
  assert.deepEqual(remote.document.favorites,[first]);
});

test('authorization failures and a public repository cannot produce a false successful load', async () => {
  for (const options of [{readStatus:401},{readStatus:403},{private:false}]) {
    const remote = githubFile([],options);
    const store = api.createGitHubFavoritesStore({token:'test-token',fetchImpl:remote.fetchImpl});
    await assert.rejects(async () => store.read());
    assert.equal(remote.requests.filter(request => request.method === 'PUT').length,0);
  }
});

test('malformed cloud data prevents every write', async () => {
  const remote = githubFile([], {document:{version:3,favorites:[first]}});
  const store = api.createGitHubFavoritesStore({token:'test-token',fetchImpl:remote.fetchImpl});
  await assert.rejects(async () => store.set(second,true));
  assert.equal(remote.requests.filter(request => request.method === 'PUT').length,0);
});

test('failed writes preserve remote data and do not block a later retry', async () => {
  const remote = githubFile([first], {writeStatus:403});
  const store = api.createGitHubFavoritesStore({token:'test-token',fetchImpl:remote.fetchImpl});
  await assert.rejects(async () => store.set(second,true), error => error.status === 403);
  assert.deepEqual(remote.document.favorites,[first]);
  delete remote.options.writeStatus;
  assert.deepEqual(await store.set(second,true),[second,first]);
});

test('simultaneous operations in one tab preserve both favorites', async () => {
  const remote = githubFile();
  const store = api.createGitHubFavoritesStore({token:'test-token',fetchImpl:remote.fetchImpl});
  await Promise.all([store.set(first,true),store.set(second,true)]);
  assert.deepEqual(remote.document.favorites,[second,first]);
});
