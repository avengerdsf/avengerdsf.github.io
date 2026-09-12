"""Exercise the generated site, not a mockup; never write to GitHub from this test."""
import functools
import json
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import shutil
import sys
from threading import Thread
from urllib.parse import unquote, urlsplit
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
try:
    with sync_playwright() as playwright:
        executable = next((shutil.which(name) for name in ['google-chrome', 'chromium', 'chromium-browser'] if shutil.which(name)), None)
        if not executable:
            raise RuntimeError('Chrome/Chromium is required for the browser checks')
        browser = playwright.chromium.launch(executable_path=executable, args=['--no-sandbox'])
        context = browser.new_context(color_scheme='light', viewport={'width':1440, 'height':1000})
        page = context.new_page()
        page.set_default_timeout(15000)
        cases = [
            ('index', '/knowledge/', ''),
            ('folder', '/knowledge/leetcode/', 'leetcode'),
            ('nested', '/knowledge/leetcode/hash-table/', 'leetcode/hash-table'),
            ('synced-folder', '/knowledge/machine-learning/chapter_01_supervised_learning/', 'machine-learning/chapter_01_supervised_learning'),
            ('article', '/knowledge/leetcode/hash-table/two-sum', None),
        ]
        for width in [320, 390, 768, 1024, 1440, 2048]:
            page.set_viewport_size({'width':width, 'height':1000})
            for name, path, scope in cases:
                response = page.goto(origin + path, wait_until='networkidle')
                assert response.ok, (path, response.status)
                expect(page.locator('.explorer-content a').first).to_be_attached()
                overflow = page.evaluate('document.documentElement.scrollWidth - innerWidth')
                assert overflow <= 1, f'{name} at {width}px overflows by {overflow}px'
                assert page.locator('.kb-brand').count() == 1
                assert page.locator('.kb-new-note').count() == 1
                home = page.get_by_role('link', name='← 返回主页', exact=True)
                expect(home).to_be_visible()
                expect(home).to_have_attribute('href', '/')
                box = home.bounding_box()
                assert box and box['x'] >= 0 and box['x'] + box['width'] <= width + 1
                brand_height = page.locator('.kb-brand').bounding_box()['height']
                assert brand_height <= 64, f'Brand must stay a compact single row: {brand_height}'
                if width > 800:
                    geometry = page.evaluate('''() => ({
                        actual: document.querySelector('.center').getBoundingClientRect().width,
                        track: parseFloat(getComputedStyle(document.querySelector('#quartz-body')).gridTemplateColumns.split(' ')[1])
                    })''')
                    assert geometry['actual'] >= geometry['track'] - 1, f'Reading pane does not fill its grid track: {geometry}'
                if scope is not None:
                    expect(page.locator('.kb-overview')).to_have_count(1)
                    expect(page.locator('.kb-overview')).to_have_attribute('data-scope', scope)
                    expect(page.locator('.center article:visible, .center .page-listing:visible')).to_have_count(0)
                    expect(page.locator('.kb-all-notes, .kb-browse, .kb-note-preview')).to_have_count(0)
                    if not scope:
                        # The landing page is an entry point, not an all-notes dashboard.
                        assert page.locator('.kb-note-list').count() == 0, 'Root must show directories, not every note'
                        expect(page.locator('.kb-directory-list')).to_be_visible()
                        links = page.locator('.kb-directory-link').evaluate_all('(links) => links.map(a => a.getAttribute("href"))')
                        assert links and len(links) == len(set(links))
                        for link in links:
                            assert link.startswith('/knowledge/') and link.endswith('/')
                            assert len(unquote(urlsplit(link).path).strip('/').split('/')) == 2, link
                            assert (root / unquote(urlsplit(link).path).lstrip('/') / 'index.html').is_file(), link
                    else:
                        expect(page.locator('.kb-note-list')).to_be_visible()
                        expect(page.locator('.kb-directory-list')).to_have_count(0)
                        links = page.locator('.kb-note-list a').evaluate_all('(links) => links.map(a => a.getAttribute("href"))')
                        assert links and len(links) == len(set(links))
                        for link in links:
                            assert not link.endswith('/'), f'A directory must link directly to articles: {link}'
                            assert link.startswith(f'/knowledge/{scope}/'), f'Note leaked from another directory: {link}'
                            target = root / unquote(urlsplit(link).path).lstrip('/')
                            assert target.is_file() or Path(str(target)+'.html').is_file(), link
                        rows = page.locator('.kb-note-link').evaluate_all('''links => links.map(a => ({
                            top: a.getBoundingClientRect().top, bottom: a.getBoundingClientRect().bottom,
                            radius: getComputedStyle(a).borderRadius
                        }))''')
                        assert all(row['radius'] == '0px' for row in rows), 'Notes must be plain rows, not separate cards'
                        assert all(rows[i]['top'] >= rows[i-1]['bottom'] - 1 for i in range(1, len(rows))), 'Notes must remain a single-column list'
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
        # Enter through the actual landing-page directory, then directly open an article.
        page.locator('.kb-directory-link[href="/knowledge/leetcode/"]').click()
        expect(page.locator('.kb-overview')).to_have_attribute('data-scope', 'leetcode')
        first = page.locator('.kb-note-list a[href="/knowledge/leetcode/hash-table/two-sum"]')
        expect(first).to_be_visible()
        first.click()
        page.wait_for_url(origin+'/knowledge/leetcode/hash-table/two-sum')
        expect(page.locator('.article-back-link')).to_be_attached()
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
            page.goto(origin+'/knowledge/leetcode/', wait_until='networkidle')
            page.get_by_role('link', name='← 返回主页', exact=True).click()
            page.wait_for_url(origin+'/')
        (output/'report.json').write_text(json.dumps({'responsive':results, 'directoryLanding':True, 'scopedListings':True, 'search':True, 'navigation':True, 'themePersistence':True, 'mobileMenu':True, 'homeNavigation':True}, indent=2))
        browser.close()
finally:
    server.shutdown()
print('Browser checks passed: directory landing, plain article lists, 30 responsive cases, search, navigation, theme and return home.')
