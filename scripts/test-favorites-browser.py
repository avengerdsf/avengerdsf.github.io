"""Verify GitHub-backed favorites with independent browsers and the built site."""
import base64
import functools
import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import shutil
import sys
from threading import Thread
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, expect

root = Path(sys.argv[1]).resolve()
output = Path(sys.argv[2]).resolve()
output.mkdir(parents=True, exist_ok=True)

class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        result = super().translate_path(path)
        return result + '.html' if not Path(result).exists() and Path(result + '.html').is_file() else result
    def log_message(self, *_args):
        pass

class GitHubFile:
    def __init__(self):
        self.favorites = []
        self.revision = 1
        self.write_status = None
        self.read_failure = None
        self.before_write = None
        self.before_read = None
    def route(self, route):
        request = route.request
        assert request.headers.get('authorization') == 'Bearer test-token'
        if request.method == 'GET' and self.read_failure:
            if self.read_failure == 'offline':
                route.abort('internetdisconnected')
            else:
                route.fulfill(status=self.read_failure,content_type='application/json',body='{}')
            return
        path = urlsplit(request.url).path
        status = 200
        if path == '/repos/avengerdsf/knowledge-favorites':
            result = {'private':True}
        elif request.method == 'GET':
            assert path == '/repos/avengerdsf/knowledge-favorites/contents/favorites.json'
            result = {'type':'file','encoding':'base64','sha':f'{self.revision:040d}','content':base64.b64encode(json.dumps({'version':1,'favorites':self.favorites}).encode()).decode()}
            if self.before_read:
                action, self.before_read = self.before_read, None
                action()
        else:
            assert request.method == 'PUT'
            body = request.post_data_json
            assert body['branch'] == 'main'
            if self.write_status:
                result, status = {'message':'write refused'}, self.write_status
            elif body['sha'] != f'{self.revision:040d}':
                result, status = {'message':'conflict'}, 409
            else:
                document = json.loads(base64.b64decode(body['content']))
                assert list(document) == ['version','favorites']
                assert 'test-token' not in json.dumps(document)
                self.favorites = document['favorites']
                self.revision += 1
                if self.before_write:
                    action, self.before_write = self.before_write, None
                    action()
                result = {'content':{'sha':f'{self.revision:040d}'}}
        route.fulfill(status=status, content_type='application/json', body=json.dumps(result))

server = ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
origin = f'http://127.0.0.1:{server.server_port}'
cloud = GitHubFile()

def authorize(page, remember=False):
    dialog = page.locator('[data-favorites-dialog]')
    expect(dialog).to_be_visible()
    dialog.locator('[data-favorites-token]').fill('test-token')
    dialog.locator('[data-favorites-remember]').set_checked(remember)
    dialog.locator('[data-favorites-connect]').click()
    expect(dialog).not_to_be_visible()

try:
    with sync_playwright() as p:
        candidates = [os.environ.get('BROWSER_EXECUTABLE'),shutil.which('google-chrome'),shutil.which('chromium'),r'C:\Program Files\Google\Chrome\Application\chrome.exe',r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe']
        executable = next((candidate for candidate in candidates if candidate and Path(candidate).is_file()),None)
        if not executable:
            raise RuntimeError('A browser executable is required')
        browser = p.chromium.launch(executable_path=executable,args=['--no-sandbox'])
        for failure in ['offline',401]:
            recovery = browser.new_context()
            recovery.route('https://api.github.com/**',cloud.route)
            recovery.add_init_script('localStorage.setItem("avengerdsf-favorites-device","test-token")')
            retry = recovery.new_page()
            cloud.read_failure = failure
            retry.goto(origin+'/knowledge/leetcode/?browse=favorites',wait_until='networkidle')
            retry.wait_for_function('!window.__knowledgeFavorites.getState().loading')
            assert not retry.evaluate('window.__knowledgeFavorites.getState().connected')
            retry.locator('[data-favorites-settings]').first.click()
            expect(retry.locator('[data-favorites-disconnect]')).to_be_visible()
            retry.locator('[data-favorites-close]').click()
            cloud.read_failure = None
            retry.locator('[data-favorites-refresh]').click()
            retry.wait_for_function('window.__knowledgeFavorites.getState().connected')
            cloud.read_failure = failure
            retry.reload(wait_until='networkidle')
            retry.wait_for_function('!window.__knowledgeFavorites.getState().loading')
            retry.locator('[data-favorites-settings]').first.click()
            retry.locator('[data-favorites-disconnect]').click()
            assert retry.evaluate('localStorage.getItem("avengerdsf-favorites-device")') is None
            assert retry.evaluate('sessionStorage.getItem("avengerdsf-favorites-session")') is None
            recovery.close()
        cloud.read_failure = None
        for remember in [True,False]:
            tabs = browser.new_context()
            tabs.route('https://api.github.com/**',cloud.route)
            owner, sibling = tabs.new_page(), tabs.new_page()
            owner.goto(origin+'/knowledge/leetcode/?browse=favorites',wait_until='networkidle')
            owner.locator('[data-favorites-settings]').first.click()
            authorize(owner,remember)
            sibling.goto(origin+'/knowledge/leetcode/?browse=favorites',wait_until='networkidle')
            if not remember:
                sibling.locator('[data-favorites-settings]').first.click()
                authorize(sibling)
            sibling.wait_for_function('window.__knowledgeFavorites.getState().connected')
            owner.locator('[data-favorites-settings]').first.click()
            def log_out_device():
                owner.evaluate('document.querySelector("[data-favorites-disconnect]").click()')
                sibling.wait_for_function('!window.__knowledgeFavorites.getState().connected',timeout=5000)
            if remember:
                log_out_device()
            else:
                cloud.before_read = log_out_device
                with sibling.expect_response(lambda response: '/contents/favorites.json' in response.url):
                    sibling.locator('[data-favorites-refresh]').click()
                sibling.wait_for_function('!window.__knowledgeFavorites.getState().connected')
            for tab in [owner,sibling]:
                assert not tab.evaluate('window.__knowledgeFavorites.getState().connected')
                assert not tab.evaluate('window.__knowledgeFavorites.getState().loading')
                assert tab.evaluate('localStorage.getItem("avengerdsf-favorites-device")') is None
                assert tab.evaluate('sessionStorage.getItem("avengerdsf-favorites-session")') is None
            tabs.close()
        a = browser.new_context(viewport={'width':1440,'height':1000})
        b = browser.new_context(viewport={'width':390,'height':844})
        a.route('https://api.github.com/**',cloud.route)
        b.route('https://api.github.com/**',cloud.route)
        page, other = a.new_page(), b.new_page()
        errors = []
        page.on('pageerror',lambda error:errors.append(str(error)))
        other.on('pageerror',lambda error:errors.append(str(error)))
        page.goto(origin+'/knowledge/leetcode/linked-list/p4044',wait_until='networkidle')
        favorite = page.locator('[data-favorite-note]')
        expect(favorite).to_be_visible()
        code = page.locator('.kb-solution-card details.algorithm-code')
        expect(code).to_have_count(1)
        assert code.get_attribute('open') is None
        code.locator('summary').click()
        expect(code).to_have_attribute('open','')
        code.locator('summary').click()
        assert code.get_attribute('open') is None
        page.evaluate('scrollTo(0,0)')
        code_link = page.locator('.sidebar.right a').filter(has_text='代码').first
        code_link.click()
        expect(code.locator('summary')).to_be_in_viewport()
        favorite.click()
        authorize(page)
        expect(favorite).to_have_attribute('aria-pressed','true')
        assert cloud.favorites == ['leetcode/linked-list/p4044']
        assert page.evaluate('localStorage.getItem("avengerdsf-favorites-device")') is None
        page.reload(wait_until='networkidle')
        expect(favorite).to_have_attribute('aria-pressed','true')
        page.screenshot(path=str(output/'favorites-desktop.png'))

        other.goto(origin+'/knowledge/leetcode/',wait_until='networkidle')
        if not other.locator('[data-favorites-panel]').is_visible():
            other.locator('[data-favorites-toggle]').click()
        other.locator('[data-favorites-settings]').first.click()
        authorize(other,remember=True)
        favorite_links = other.locator('[data-favorite-notes] a')
        expect(favorite_links).to_have_count(1)
        expect(favorite_links.first).to_contain_text('合并两个有序链表')
        assert other.evaluate('document.documentElement.scrollWidth - innerWidth') <= 1
        other.screenshot(path=str(output/'favorites-mobile.png'))
        favorite_links.first.click()
        expect(other.locator('[data-favorite-note]')).to_have_attribute('aria-pressed','true')
        other.locator('[data-favorite-note]').click()
        expect(other.locator('[data-favorite-note]')).to_have_attribute('aria-pressed','false')
        assert cloud.favorites == []
        page.reload(wait_until='networkidle')
        expect(favorite).to_have_attribute('aria-pressed','false')

        page.goto(origin+'/knowledge/leetcode/',wait_until='networkidle')
        page.locator('[data-random-toggle]').click()
        order = page.locator('[data-random-notes] a').evaluate_all('(nodes) => nodes.map(node => node.getAttribute("href"))')
        page.locator('[data-random-notes] a').nth(2).click()
        expect(page.locator('[data-random-next]')).to_have_attribute('href',order[3])
        def continue_while_saving():
            page.evaluate('document.querySelector("[data-random-next]").click()')
            page.wait_for_url(origin+order[3])
        cloud.before_write = continue_while_saving
        page.locator('[data-favorite-note]').click()
        page.wait_for_url(origin+order[3])
        expect(page.locator('[data-favorite-note]')).to_be_enabled()
        expect(page.locator('[data-favorite-note]')).to_have_attribute('aria-pressed','false')
        saved_slug = urlsplit(order[2]).path.removeprefix('/knowledge/')
        assert cloud.favorites == [saved_slug]
        page.locator('[data-random-return]').click()
        expect(page.locator('[data-random-notes]')).to_be_visible()
        assert page.locator('[data-random-notes] a').evaluate_all('(nodes) => nodes.map(node => node.getAttribute("href"))') == order
        page.locator('[data-favorites-toggle]').click()
        expect(page.locator('[data-favorite-notes] a')).to_have_count(1)
        page.locator('[data-favorite-notes] a').first.click()
        cloud.write_status = 403
        page.locator('[data-favorite-note]').click()
        expect(page.locator('[data-favorite-note]')).to_be_enabled()
        expect(page.locator('[data-favorite-note]')).to_have_attribute('aria-pressed','true')
        assert cloud.favorites == [saved_slug]
        cloud.write_status = None
        page.locator('[data-favorite-note]').click()
        expect(page.locator('[data-favorite-note]')).to_have_attribute('aria-pressed','false')
        assert cloud.favorites == []

        other.goto(origin+'/knowledge/leetcode/',wait_until='networkidle')
        if not other.locator('[data-favorites-panel]').is_visible():
            other.locator('[data-favorites-toggle]').click()
        other.locator('[data-favorites-settings]').first.click()
        expect(other.locator('[data-favorites-disconnect]')).to_be_visible()
        other.locator('[data-favorites-disconnect]').click()
        assert other.evaluate('localStorage.getItem("avengerdsf-favorites-device")') is None
        assert other.evaluate('sessionStorage.getItem("avengerdsf-favorites-session")') is None
        c = browser.new_context(viewport={'width':3840,'height':1080})
        c.route('https://api.github.com/**',cloud.route)
        wide = c.new_page()
        wide.on('pageerror',lambda error:errors.append(str(error)))
        wide.goto(origin+'/knowledge/leetcode/heap/p4083',wait_until='networkidle')
        wide.locator('[data-favorite-note]').click()
        authorize(wide)
        expect(wide.locator('[data-favorite-note]')).to_have_attribute('aria-pressed','true')
        assert wide.evaluate('document.documentElement.scrollWidth - innerWidth') <= 1
        wide.screenshot(path=str(output/'favorites-4k.png'))
        wide.locator('[data-favorite-note]').click()
        expect(wide.locator('[data-favorite-note]')).to_have_attribute('aria-pressed','false')
        assert cloud.favorites == []
        assert not errors, errors
        a.close(); b.close(); c.close(); browser.close()
        print('Favorites browser checks passed: shared GitHub file, independent devices, cancellation, shuffle retention, navigation while saving, failure recovery, saved-authorization recovery, cross-tab logout, stale-response invalidation and code folding.',flush=True)
finally:
    server.shutdown()
