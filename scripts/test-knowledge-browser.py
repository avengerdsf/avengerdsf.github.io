"""Exercise generated pages and navigation without writing to GitHub."""
import functools
import json
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import shutil
import sys
from threading import Thread
from urllib.parse import unquote, urlsplit, parse_qs
from playwright.sync_api import sync_playwright, expect

root = Path(sys.argv[1]).resolve()
output = Path(sys.argv[2]).resolve()
output.mkdir(parents=True, exist_ok=True)

class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, request_path):
        result = super().translate_path(request_path)
        if not Path(result).exists() and Path(result + '.html').is_file():
            return result + '.html'
        return result
    def log_message(self, *_args):
        pass

server = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Handler, directory=str(root)))
Thread(target=server.serve_forever, daemon=True).start()
origin = f'http://127.0.0.1:{server.server_port}'
results = []
cases = [
    ('index', '/knowledge/', '', 'directories', None),
    ('folder', '/knowledge/leetcode/', 'leetcode', 'directories', '/knowledge/'),
    ('topic', '/knowledge/leetcode/binary-search/', 'leetcode/binary-search', 'notes', '/knowledge/leetcode/'),
    ('nested', '/knowledge/leetcode/hash-table/', 'leetcode/hash-table', 'notes', '/knowledge/leetcode/'),
    ('learning', '/knowledge/machine-learning/', 'machine-learning', 'directories', '/knowledge/'),
    ('synced-folder', '/knowledge/machine-learning/chapter_01_supervised_learning/', 'machine-learning/chapter_01_supervised_learning', 'notes', '/knowledge/machine-learning/'),
    ('article', '/knowledge/leetcode/hash-table/two-sum', None, 'article', '/knowledge/leetcode/hash-table/'),
]
try:
    with sync_playwright() as playwright:
        executable = next((shutil.which(name) for name in ['google-chrome', 'chromium', 'chromium-browser'] if shutil.which(name)), None)
        if not executable:
            raise RuntimeError('Chrome/Chromium is required for the browser checks')
        browser = playwright.chromium.launch(executable_path=executable, args=['--no-sandbox'])
        context = browser.new_context(color_scheme='light', viewport={'width':1440, 'height':1000})
        page = context.new_page()
        page.set_default_timeout(15000)
        for width in [320, 390, 768, 1024, 1440, 2048]:
            page.set_viewport_size({'width':width, 'height':1000})
            for name, path, scope, kind, parent in cases:
                response = page.goto(origin + path, wait_until='networkidle')
                assert response.ok, (path, response.status)
                expect(page.locator('.explorer-content a').first).to_be_attached()
                overflow = page.evaluate('document.documentElement.scrollWidth - innerWidth')
                assert overflow <= 1, f'{name} at {width}px overflows by {overflow}px'
                expect(page.locator('.kb-brand')).to_have_count(1)
                expect(page.locator('.kb-new-note')).to_have_count(1)
                expect(page.locator('.article-back-link, .breadcrumb-container, .kb-overview-meta, .kb-directory-count')).to_have_count(0)
                home = page.get_by_role('link', name='← 返回主页', exact=True)
                expect(home).to_be_visible()
                expect(home).to_have_attribute('href', '/')
                box = home.bounding_box()
                assert box and box['x'] >= 0 and box['x'] + box['width'] <= width + 1
                assert float(home.evaluate('el => getComputedStyle(el).fontSize').removesuffix('px')) >= 16
                if parent:
                    expect(page.locator('.kb-up-link')).to_be_visible()
                    expect(page.locator('.kb-up-link')).to_have_attribute('href', parent)
                else:
                    expect(page.locator('.kb-up-link')).to_have_count(0)
                assert page.locator('.kb-brand').bounding_box()['height'] <= 64
                if width > 800:
                    geometry = page.evaluate('''() => ({
                        actual: document.querySelector('.center').getBoundingClientRect().width,
                        track: parseFloat(getComputedStyle(document.querySelector('#quartz-body')).gridTemplateColumns.split(' ')[1])
                    })''')
                    assert geometry['actual'] >= geometry['track'] - 1, geometry
                if kind != 'article':
                    expect(page.locator('.kb-overview')).to_have_count(1)
                    expect(page.locator('.kb-overview')).to_have_attribute('data-scope', scope)
                    expect(page.locator('.center article:visible, .center .page-listing:visible')).to_have_count(0)
                    expect(page.locator('.kb-all-notes, .kb-browse, .kb-note-preview')).to_have_count(0)
                    if kind == 'directories':
                        expect(page.locator('.kb-note-list')).to_have_count(0)
                        expect(page.locator('.kb-directory-list')).to_be_visible()
                        links = page.locator('.kb-directory-link').evaluate_all('(links) => links.map(a => a.getAttribute("href"))')
                        prefix = '/knowledge/' + (scope + '/' if scope else '')
                        assert links and len(links) == len(set(links))
                        for link in links:
                            assert link.startswith(prefix) and link.endswith('/')
                            assert '/' not in unquote(link[len(prefix):]).strip('/'), link
                            assert (root / unquote(urlsplit(link).path).lstrip('/') / 'index.html').is_file(), link
                        if name == 'folder':
                            assert '/knowledge/leetcode/binary-search/' in links
                            assert '/knowledge/leetcode/sliding-window/' in links
                            assert '/knowledge/leetcode/hash-table/' in links
                    else:
                        expect(page.locator('.kb-note-list')).to_be_visible()
                        expect(page.locator('.kb-directory-list')).to_have_count(0)
                        links = page.locator('.kb-note-list a').evaluate_all('(links) => links.map(a => a.getAttribute("href"))')
                        assert links and len(links) == len(set(links))
                        prefix = f'/knowledge/{scope}/'
                        for link in links:
                            assert link.startswith(prefix) and '/' not in link[len(prefix):], link
                            target = root / unquote(urlsplit(link).path).lstrip('/')
                            assert target.is_file() or Path(str(target)+'.html').is_file(), link
                        rows = page.locator('.kb-note-link').evaluate_all('''links => links.map(a => ({
                            top: a.getBoundingClientRect().top, bottom: a.getBoundingClientRect().bottom,
                            radius: getComputedStyle(a).borderRadius
                        }))''')
                        assert all(row['radius'] == '0px' for row in rows)
                        assert all(rows[i]['top'] >= rows[i-1]['bottom'] - 1 for i in range(1, len(rows)))
                else:
                    expect(page.locator('two-sum-demo .two-sum-demo__pointer').first).to_be_attached()
                    expect(page.locator('.algorithm-code')).to_have_count(1)
                    assert 'knowledge/leetcode/hash-table/two-sum.md' in page.locator('.kb-edit-link').get_attribute('href')
                page.screenshot(path=str(output/f'{name}-{width}.png'), full_page=False)
                if width == 1440:
                    (output/f'{name}-dom.html').write_text(page.content())
                results.append({'page':name, 'width':width, 'overflow':overflow, 'homeVisible':True})

        page.set_viewport_size({'width':1440, 'height':1000})
        page.goto(origin+'/knowledge/', wait_until='networkidle')
        page.locator('.search-button').click()
        page.locator('.search-bar').fill('两数之和')
        expect(page.locator('.search-layout')).to_contain_text('两数之和')
        page.keyboard.press('Escape')
        expect(page.locator('.search-container')).not_to_be_visible()
        page.locator('.kb-directory-link[href="/knowledge/leetcode/"]').click()
        page.locator('.kb-directory-link[href="/knowledge/leetcode/binary-search/"]').click()
        expect(page.locator('.kb-overview')).to_have_attribute('data-scope', 'leetcode/binary-search')
        query = parse_qs(urlsplit(page.locator('.kb-new-note').get_attribute('href')).query)
        assert query['filename'] == ['knowledge/leetcode/binary-search/新笔记.md']
        page.locator('.kb-note-link[href="/knowledge/leetcode/binary-search/overview"]').click()
        expect(page.locator('.article-title')).to_contain_text('边界与模板')
        for path in ['/knowledge/leetcode/binary-search/', '/knowledge/leetcode/', '/knowledge/']:
            page.locator('.kb-up-link').click()
            page.wait_for_url(origin + path)
        # Existing question, code folding and algorithm demo still work.
        page.locator('.kb-directory-link[href="/knowledge/leetcode/"]').click()
        page.locator('.kb-directory-link[href="/knowledge/leetcode/hash-table/"]').click()
        page.locator('.kb-note-link[href="/knowledge/leetcode/hash-table/two-sum"]').click()
        page.wait_for_url(origin+'/knowledge/leetcode/hash-table/two-sum')
        page.locator('two-sum-demo [data-action="next"]').click()
        expect(page.locator('.two-sum-demo__status')).to_contain_text('查找')
        page.locator('.algorithm-code > summary').click()
        expect(page.locator('.algorithm-code')).to_have_attribute('open', '')
        page.locator('.darkmode').click()
        expect(page.locator('html')).to_have_attribute('saved-theme', 'dark')
        assert page.evaluate('localStorage.getItem("avengerdsf-site-theme")') == 'dark'
        page.get_by_role('link', name='← 返回主页', exact=True).click()
        page.wait_for_url(origin+'/')
        expect(page.locator('html')).to_have_attribute('data-theme', 'dark')
        page.goto(origin+'/knowledge/', wait_until='networkidle')
        expect(page.locator('html')).to_have_attribute('saved-theme', 'dark')
        page.screenshot(path=str(output/'index-dark.png'))
        page.set_viewport_size({'width':390, 'height':844})
        page.reload(wait_until='networkidle')
        page.locator('.mobile-explorer').click()
        expect(page.locator('.explorer')).to_have_attribute('aria-expanded', 'true')
        page.screenshot(path=str(output/'mobile-navigation.png'))
        page.locator('.mobile-explorer').click()
        expect(page.locator('.explorer')).to_have_attribute('aria-expanded', 'false')
        for width in [390, 1024]:
            page.set_viewport_size({'width':width, 'height':844})
            page.goto(origin+'/knowledge/leetcode/binary-search/', wait_until='networkidle')
            page.locator('.kb-up-link').click()
            page.wait_for_url(origin+'/knowledge/leetcode/')
            page.get_by_role('link', name='← 返回主页', exact=True).click()
            page.wait_for_url(origin+'/')
        (output/'report.json').write_text(json.dumps({'responsive':results, 'topicHierarchy':True, 'noMetadataMicrocopy':True, 'search':True, 'parentNavigation':True, 'newNoteFolder':True, 'themePersistence':True, 'mobileMenu':True, 'homeNavigation':True}, indent=2))
        browser.close()
finally:
    server.shutdown()
print('Browser checks passed: 42 responsive cases, topic hierarchy, clean navigation, authoring folder and preserved interactions.')
