"""Check whole-solution switching and deep links in the built P4096 note."""
import functools
import os
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
import shutil
import sys
from threading import Thread
from urllib.parse import unquote,urlsplit
from playwright.sync_api import sync_playwright,expect

root = Path(sys.argv[1]).resolve()
output = Path(sys.argv[2]).resolve()
output.mkdir(parents=True,exist_ok=True)

class Handler(SimpleHTTPRequestHandler):
    def translate_path(self,path):
        result = super().translate_path(path)
        return result+'.html' if not Path(result).exists() and Path(result+'.html').is_file() else result
    def log_message(self,*_args):
        pass

server = ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
origin = f'http://127.0.0.1:{server.server_port}'
note = origin+'/knowledge/leetcode/dynamic-programming/p4096'
try:
    with sync_playwright() as p:
        candidates = [os.environ.get('BROWSER_EXECUTABLE'),shutil.which('google-chrome'),shutil.which('chromium'),r'C:\Program Files\Google\Chrome\Application\chrome.exe',r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe']
        executable = next((path for path in candidates if path and Path(path).is_file()),None)
        if not executable:
            raise RuntimeError('A browser executable is required')
        browser = p.chromium.launch(executable_path=executable,args=['--no-sandbox'])
        try:
            for width in [390,1440,3840]:
                context = browser.new_context(viewport={'width':width,'height':1000})
                page = context.new_page()
                errors = []
                page.on('pageerror',lambda error:errors.append(str(error)))
                page.goto(note,wait_until='networkidle')
                one = page.get_by_role('button',name='一维 DP',exact=True)
                two = page.get_by_role('button',name='二维 DP',exact=True)
                expect(one).to_be_visible()
                expect(two).to_be_visible()
                panels = page.locator('[data-solution-panel]')
                expect(panels).to_have_count(2)
                expect(one).to_have_attribute('aria-pressed','true')
                expect(two).to_have_attribute('aria-pressed','false')
                expect(panels.nth(0)).to_be_visible()
                expect(panels.nth(1)).not_to_be_visible()
                expect(panels.nth(0)).to_contain_text('一维 DP 注意点')
                problem = page.locator('.kb-problem-card').inner_text()
                code_one = panels.nth(0).locator('details.algorithm-code')
                code_two = panels.nth(1).locator('details.algorithm-code')
                assert code_one.get_attribute('open') is None
                assert code_two.get_attribute('open') is None
                two.click()
                expect(two).to_have_attribute('aria-pressed','true')
                expect(panels.nth(0)).not_to_be_visible()
                expect(panels.nth(1)).to_be_visible()
                expect(panels.nth(1)).not_to_contain_text('一维 DP 注意点')
                assert page.locator('.kb-problem-card').inner_text() == problem
                for phase in ['定义状态','状态转移方程','初始状态和边界条件','状态转移方程求解']:
                    expect(panels.nth(1).get_by_role('heading',name=phase,exact=True)).to_be_visible()
                code_two.locator('summary').click()
                expect(code_two.locator('pre')).to_contain_text('dp = [[False] * (target + 1) for _ in range(n + 1)]')
                code_two.locator('summary').click()
                assert page.evaluate('document.documentElement.scrollWidth - innerWidth') <= 1
                two.scroll_into_view_if_needed()
                page.screenshot(path=str(output/f'solution-switch-{width}.png'))
                assert unquote(urlsplit(page.url).fragment) == '二维-dp-解法'
                page.reload(wait_until='networkidle')
                expect(panels.nth(1)).to_be_visible()
                one.focus()
                page.keyboard.press('Enter')
                expect(panels.nth(0)).to_be_visible()
                expect(panels.nth(1)).not_to_be_visible()
                two.focus()
                page.keyboard.press('Space')
                expect(panels.nth(1)).to_be_visible()
                page.goto(note+'#一维-dp-注意点',wait_until='networkidle')
                expect(panels.nth(0)).to_be_visible()
                expect(panels.nth(1)).not_to_be_visible()
                page.goto(note+'#代码-1',wait_until='networkidle')
                expect(panels.nth(1)).to_be_visible()
                expect(code_two.locator('summary')).to_be_in_viewport()
                if width >= 1440:
                    one.click()
                    page.locator('.sidebar.right a').filter(has_text='二维 DP 解法').click()
                    expect(panels.nth(1)).to_be_visible()
                    expect(panels.nth(1).get_by_role('heading',name='二维 DP 解法',exact=True)).to_be_in_viewport()
                page.goto(origin+'/knowledge/leetcode/dynamic-programming/p4095',wait_until='networkidle')
                expect(page.locator('[data-solution-switcher]')).to_have_count(0)
                assert not errors, errors
                context.close()
                print(f'Solution switch passed at {width}px: default, whole method, code folding, keyboard, refresh, deep links and ordinary note.',flush=True)
        finally:
            browser.close()
finally:
    server.shutdown()
