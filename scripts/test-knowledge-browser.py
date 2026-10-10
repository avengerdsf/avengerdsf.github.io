"""Verify the actual built site, including floating navigation and responsive reading."""
import functools
import json
import os
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
    ('index', '/knowledge/', '', '/knowledge/'),
    ('folder', '/knowledge/leetcode/', 'leetcode', '/knowledge/'),
    ('topic', '/knowledge/leetcode/binary-search/', 'leetcode/binary-search', '/knowledge/leetcode/'),
    ('nested', '/knowledge/leetcode/hash-table/', 'leetcode/hash-table', '/knowledge/leetcode/'),
    ('learning', '/knowledge/machine-learning/', 'machine-learning', '/knowledge/'),
    ('synced-folder', '/knowledge/machine-learning/chapter_01_supervised_learning/', 'machine-learning/chapter_01_supervised_learning', '/knowledge/machine-learning/'),
    ('article', '/knowledge/leetcode/hash-table/two-sum', None, '/knowledge/leetcode/hash-table/'),
    ('learning-article', '/knowledge/machine-learning/chapter_01_supervised_learning/01_learning_regression', None, '/knowledge/machine-learning/chapter_01_supervised_learning/'),
]
def tools(page):
    menu = page.locator('.kb-tools')
    if menu.get_attribute('open') is None:
        menu.locator('summary').click()
    return menu

def no_overflow(page, label):
    overflow = page.evaluate('document.documentElement.scrollWidth - innerWidth')
    assert overflow <= 1, f'{label}: horizontal overflow {overflow}px'
    return overflow

def entry_appearance(page, selector):
    return page.locator(selector).first.evaluate('''el => {
        const pick = (node, keys) => {
            if (!node) return null;
            const css = getComputedStyle(node);
            return Object.fromEntries(keys.map(key => [key, css[key]]));
        };
        return {
            card: pick(el, ['display', 'gap', 'minHeight', 'padding', 'borderWidth', 'borderStyle', 'borderRadius', 'backgroundColor', 'color', 'transitionProperty']),
            title: pick(el.querySelector('.kb-entry-title') || el.querySelector('.kb-directory-label strong, .kb-note-title'), ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'color', 'overflowWrap']),
            list: pick(el.closest('ul'), ['display', 'gridTemplateColumns', 'rowGap', 'columnGap']),
            itemBorder: getComputedStyle(el.parentElement).borderBottomWidth,
        };
    }''')

def stable_navigation(page, locator, destination):
    page.evaluate('''() => {
        const selectors = {toolbar: '.page-header > header', brand: '.kb-brand', search: '.search-button', actions: '.kb-actions', theme: '.darkmode', sidebar: '.sidebar.left', directoryTitle: '.kb-drawer-head', reading: '.center'};
        const snapshot = () => Object.fromEntries(Object.entries(selectors).map(([name, selector]) => {
            const el = document.querySelector(selector);
            if (!el) return [name, null];
            const css = getComputedStyle(el), r = el.getBoundingClientRect();
            if (css.display === 'none' || r.width === 0 || r.height === 0) return [name, null];
            return [name, {x:r.x, y:r.y, width:r.width, height:r.height, visibility:css.visibility, opacity:Number(css.opacity)}];
        }));
        const trace = {baseline:snapshot(), frames:[], navigated:false, postFrames:0, complete:false};
        window.__kbNavigationTrace = trace;
        document.addEventListener('nav', () => {trace.navigated = true;}, {once:true});
        const sample = () => {
            trace.frames.push({controls:snapshot(), treeLinks:document.querySelectorAll('.explorer-content a').length});
            if (trace.navigated) trace.postFrames++;
            if (trace.postFrames >= 8) trace.complete = true;
            else requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
    }''')
    locator.click()
    page.wait_for_url(destination)
    page.wait_for_function('window.__kbNavigationTrace.complete')
    trace = page.evaluate('window.__kbNavigationTrace')
    for index, frame in enumerate(trace['frames']):
        for name, baseline in trace['baseline'].items():
            if baseline is None:
                assert frame['controls'][name] is None, f'{destination}: hidden {name} appears at frame {index}'
                continue
            actual = frame['controls'][name]
            assert actual is not None, f'{destination}: {name} disappears at frame {index}'
            assert actual['visibility'] == 'visible' and actual['opacity'] > 0.99, (destination, name, index, actual)
            fields = ['x', 'width'] if name == 'reading' else ['x', 'y', 'width', 'height']
            for field in fields:
                assert abs(actual[field] - baseline[field]) <= 1, f'{destination}: {name}.{field} shifts {baseline[field]} -> {actual[field]} at frame {index}'
        assert frame['treeLinks'] > 0, f'{destination}: directory tree is empty at frame {index}'
    return {'destination':destination, 'frameCount':len(trace['frames']), 'trace':trace}

try:
    with sync_playwright() as playwright:
        candidates = [os.environ.get('BROWSER_EXECUTABLE'), shutil.which('google-chrome'), shutil.which('chromium'), shutil.which('chromium-browser'), r'C:\Program Files\Google\Chrome\Application\chrome.exe', r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe']
        executable = next((candidate for candidate in candidates if candidate and Path(candidate).is_file()), None)
        if not executable:
            raise RuntimeError('Chrome/Chromium is required for browser checks; set BROWSER_EXECUTABLE')
        browser = playwright.chromium.launch(executable_path=executable, args=['--no-sandbox'])
        context = browser.new_context(color_scheme='light', viewport={'width':1440, 'height':1000})
        page = context.new_page()
        page.set_default_timeout(15000)
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        widths = [int(value) for value in sys.argv[3].split(',')] if len(sys.argv) > 3 else [320, 390, 768, 1024, 1440, 2048]
        for width in widths:
            page.set_viewport_size({'width':width, 'height':1000})
            reference_entry = None
            for name, path, scope, parent in cases:
                response = page.goto(origin + path, wait_until='networkidle')
                assert response.ok, (path, response.status)
                expect(page.locator('.kb-brand')).to_be_visible()
                expect(page.locator('.kb-brand')).to_have_attribute('href', '/')
                overflow = no_overflow(page, f'{name} {width}px')
                expect(page.locator('.breadcrumb-container, .kb-overview-meta, .kb-directory-count')).to_have_count(0)
                toolbar = page.locator('.page-header > header')
                expect(toolbar).to_be_visible()
                assert toolbar.evaluate('el => getComputedStyle(el).position') == 'fixed'
                toolbar_box = toolbar.bounding_box()
                assert toolbar_box['x'] >= -1 and toolbar_box['x'] + toolbar_box['width'] <= width + 1
                assert toolbar_box['height'] <= 72, toolbar_box
                title_box = page.locator('.article-title').bounding_box()
                assert title_box['y'] >= toolbar_box['y'] + toolbar_box['height'], (name, width, title_box, toolbar_box)
                menu = tools(page)
                expect(menu.locator('.kb-new-note')).to_be_visible()
                if scope != '':
                    parent_link = menu.locator('.kb-root-link' if parent == '/knowledge/' else '.kb-up-link')
                    expect(parent_link).to_be_visible()
                    expect(parent_link).to_have_attribute('href', parent)
                menu.locator('summary').click()
                if scope is not None:
                    expect(page.locator('.kb-overview')).to_have_attribute('data-scope', scope)
                    expect(page.locator('.center article:visible, .center .page-listing:visible')).to_have_count(0)
                    if name == 'index':
                        reference_entry = entry_appearance(page, '.kb-directory-link')
                    for selector in ['.kb-directory-link', '.kb-note-link']:
                        if page.locator(selector).count():
                            actual_entry = entry_appearance(page, selector)
                            assert actual_entry == reference_entry, f'{name} at {width}px changes entry appearance: {actual_entry} vs {reference_entry}'
                    prefix = '/knowledge/' + (scope + '/' if scope else '')
                    directories = page.locator('.kb-directory-link').evaluate_all('(links) => links.map(a => a.getAttribute("href"))')
                    notes = page.locator('.kb-note-link').evaluate_all('(links) => links.map(a => a.getAttribute("href"))')
                    assert len(directories) == len(set(directories))
                    assert len(notes) == len(set(notes))
                    for link in directories:
                        assert link.startswith(prefix) and link.endswith('/')
                        assert '/' not in unquote(link[len(prefix):]).strip('/'), link
                        assert (root / unquote(urlsplit(link).path).lstrip('/') / 'index.html').is_file(), link
                    for link in notes:
                        assert link.startswith(prefix) and '/' not in unquote(link[len(prefix):]), link
                        target = root / unquote(urlsplit(link).path).lstrip('/')
                        assert target.is_file() or Path(str(target)+'.html').is_file(), link
                    if name == 'folder':
                        assert '/knowledge/leetcode/binary-search/' in directories
                        assert '/knowledge/leetcode/hash-table/' in directories
                        assert len(directories) == 18
                else:
                    if name == 'learning-article':
                        expect(page.locator('.article-title')).to_have_text('线性回归模型')
                        expect(page.locator('article > h1')).to_have_count(0)
                        expect(page.locator('.katex').first).to_be_visible()
                    else:
                        expect(page.locator('.article-title')).to_have_text('P4000 · 两数之和')
                        expect(page.locator('two-sum-demo')).to_have_count(0)
                    if name == 'article':
                        expect(page.locator('.algorithm-code')).to_have_count(1)
                    assert page.locator('.center').bounding_box()['width'] <= 900
                    expected_source = 'knowledge/leetcode/hash-table/two-sum.md' if name == 'article' else 'machine-learning-notes/edit/main/chapter_01_supervised_learning/01_learning_regression.md'
                    assert expected_source in page.locator('.kb-edit-link').get_attribute('href')
                page.screenshot(path=str(output/f'{name}-{width}.png'))
                results.append({'page':name, 'width':width, 'overflow':overflow})
            page.goto(origin+'/', wait_until='networkidle')
            no_overflow(page, f'home {width}px')
            expect(page.locator('.site-header')).to_be_visible()
            assert page.locator('.site-header').evaluate('el => getComputedStyle(el).position') == 'fixed'
            expect(page.locator('a[href="knowledge/leetcode/"]')).to_be_visible()
            expect(page.locator('a[href="knowledge/machine-learning/"]')).to_be_visible()
            assert not page.locator('a[href*="knowledge/#"]').count()
            page.screenshot(path=str(output/f'home-{width}.png'))
            print(f'Responsive pages passed at {width}px', flush=True)

        transitions = []
        for width in [390, 1024, 1440, 2048]:
            page.set_viewport_size({'width':width, 'height':1000})
            page.goto(origin+'/knowledge/', wait_until='networkidle')
            expect(page.locator('.explorer-content a').first).to_be_attached()
            chain = [
                ('.kb-directory-link[href="/knowledge/leetcode/"]', '/knowledge/leetcode/'),
                ('.kb-directory-link[href="/knowledge/leetcode/hash-table/"]', '/knowledge/leetcode/hash-table/'),
                ('.kb-note-link[href="/knowledge/leetcode/hash-table/two-sum"]', '/knowledge/leetcode/hash-table/two-sum'),
            ]
            for selector, path in chain:
                result = stable_navigation(page, page.locator(selector), origin+path)
                transitions.append({'width':width, **result})
            for path in ['/knowledge/leetcode/hash-table/', '/knowledge/leetcode/']:
                result = stable_navigation(page, tools(page).locator(f'a[href="{path}"]'), origin+path)
                transitions.append({'width':width, **result})
            for selector, path in [('.kb-directory-link[href="/knowledge/leetcode/binary-search/"]', '/knowledge/leetcode/binary-search/'), ('.kb-note-link[href="/knowledge/leetcode/binary-search/p4023"]', '/knowledge/leetcode/binary-search/p4023')]:
                result = stable_navigation(page, page.locator(selector), origin+path)
                transitions.append({'width':width, **result})
            if width > 900:
                page.locator('[data-directory-toggle]').click()
                expect(page.locator('[data-directory-toggle]')).to_have_attribute('aria-expanded', 'false')
                path = '/knowledge/leetcode/binary-search/'
                result = stable_navigation(page, tools(page).locator(f'a[href="{path}"]'), origin+path)
                transitions.append({'width':width, 'directoryCollapsed':True, **result})
                path = '/knowledge/leetcode/binary-search/p4023'
                result = stable_navigation(page, page.locator('.kb-note-link[href="/knowledge/leetcode/binary-search/p4023"]'), origin+path)
                transitions.append({'width':width, 'directoryCollapsed':True, **result})
            print(f'Navigation frames passed at {width}px', flush=True)
        (output/'navigation-frames.json').write_text(json.dumps(transitions, indent=2), encoding='utf-8')

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
        page.locator('.kb-note-link[href="/knowledge/leetcode/binary-search/p4023"]').click()
        expect(page.locator('.article-title')).to_contain_text('P4023 · 升序数组中的目标下标与插入点')
        for path in ['/knowledge/leetcode/binary-search/', '/knowledge/leetcode/', '/knowledge/']:
            tools(page).locator(f'a[href="{path}"]').click()
            page.wait_for_url(origin + path)
        page.goto(origin+'/knowledge/leetcode/hash-table/two-sum', wait_until='networkidle')
        page.locator('.algorithm-code > summary').click()
        expect(page.locator('.algorithm-code')).to_have_attribute('open', '')
        page.evaluate('scrollTo(0, document.body.scrollHeight)')
        toolbar_box = page.locator('.page-header > header').bounding_box()
        assert 0 <= toolbar_box['y'] <= 24
        page.locator('.darkmode').click()
        expect(page.locator('html')).to_have_attribute('saved-theme', 'dark')
        assert page.evaluate('localStorage.getItem("avengerdsf-site-theme")') == 'dark'
        page.locator('.kb-brand').click()
        page.wait_for_url(origin+'/')
        expect(page.locator('html')).to_have_attribute('data-theme', 'dark')
        page.goto(origin+'/knowledge/', wait_until='networkidle')
        expect(page.locator('html')).to_have_attribute('saved-theme', 'dark')
        page.screenshot(path=str(output/'index-dark.png'))

        page.set_viewport_size({'width':390, 'height':844})
        page.reload(wait_until='networkidle')
        toggle = page.locator('[data-directory-toggle]')
        toggle.click()
        expect(toggle).to_have_attribute('aria-expanded', 'true')
        expect(page.locator('[data-directory-backdrop]')).to_be_visible()
        assert page.locator('html').evaluate('el => getComputedStyle(el).overflow') == 'hidden'
        head = page.locator('.kb-drawer-head').bounding_box()
        tree = page.locator('.explorer').bounding_box()
        assert tree['y'] <= head['y'] + head['height'] + 24, (head, tree)
        page.screenshot(path=str(output/'mobile-navigation.png'))
        page.keyboard.press('Control+k')
        expect(page.locator('.search-bar')).to_be_focused()
        expect(toggle).to_have_attribute('aria-expanded', 'false')
        expect(page.locator('[data-directory-backdrop]')).not_to_be_visible()
        page.locator('.search-bar').fill('两数之和')
        expect(page.locator('.search-layout')).to_contain_text('两数之和')
        page.keyboard.press('Escape')
        expect(page.locator('.search-container')).not_to_be_visible()
        toggle.click()
        page.keyboard.press('Escape')
        expect(toggle).to_have_attribute('aria-expanded', 'false')
        expect(toggle).to_be_focused()
        toggle.click()
        backdrop_width = page.locator('[data-directory-backdrop]').bounding_box()['width']
        page.locator('[data-directory-backdrop]').click(position={'x':backdrop_width - 5, 'y':300})
        expect(toggle).to_have_attribute('aria-expanded', 'false')
        toggle.click()
        page.locator('[data-directory-close]').click()
        expect(toggle).to_have_attribute('aria-expanded', 'false')
        toggle.click()
        page.locator('.explorer-content a[href$="leetcode/"], .explorer-content a[href$="leetcode"]').first.click()
        page.wait_for_url(origin+'/knowledge/leetcode/')
        expect(page.locator('[data-directory-toggle]')).to_have_attribute('aria-expanded', 'false')
        page.locator('[data-directory-toggle]').click()
        page.set_viewport_size({'width':1440, 'height':1000})
        expect(page.locator('[data-directory-backdrop]')).not_to_be_visible()
        assert page.locator('html').evaluate('el => getComputedStyle(el).overflow') != 'hidden'
        page.locator('[data-directory-toggle]').click()
        expect(page.locator('[data-directory-toggle]')).to_have_attribute('aria-expanded', 'false')
        page.screenshot(path=str(output/'desktop-directory-closed.png'))
        page.set_viewport_size({'width':390, 'height':844})
        expect(page.locator('[data-directory-backdrop]')).not_to_be_visible()
        no_overflow(page, 'resize')
        assert not errors, errors
        (output/'report.json').write_text(json.dumps({'responsive':results, 'homeResponsive':True, 'directHierarchy':True, 'unifiedEntryCards':True, 'stableNavigationFrames':True, 'floatingToolbar':True, 'search':True, 'parentNavigation':True, 'sourceAuthoring':True, 'themePersistence':True, 'directoryDismissal':True, 'resize':True, 'codeFolding':True, 'pageErrors':errors}, indent=2), encoding='utf-8')
        browser.close()
finally:
    server.shutdown()
print(f'Browser checks passed: {len(results)} knowledge and {len(widths)} homepage responsive cases, {len(transitions)} sampled navigation transitions, hierarchy, floating toolbar, search, themes, directory dismissal, resize and code folding.')
