"""Check shuffled question navigation against the order shown in the built site."""
import functools
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
    def translate_path(self, request_path):
        result = super().translate_path(request_path)
        return result + '.html' if not Path(result).exists() and Path(result + '.html').is_file() else result

    def log_message(self, *_args):
        pass

server = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Handler, directory=str(root)))
Thread(target=server.serve_forever, daemon=True).start()
origin = f'http://127.0.0.1:{server.server_port}'

try:
    with sync_playwright() as playwright:
        candidates = [os.environ.get('BROWSER_EXECUTABLE'), shutil.which('google-chrome'), shutil.which('chromium'), r'C:\Program Files\Google\Chrome\Application\chrome.exe', r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe']
        executable = next((candidate for candidate in candidates if candidate and Path(candidate).is_file()), None)
        if not executable:
            raise RuntimeError('A browser executable is required')
        browser = playwright.chromium.launch(executable_path=executable, args=['--no-sandbox'])
        for width in [390, 1440, 3840]:
            context = browser.new_context(viewport={'width':width, 'height':900}, color_scheme='light')
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(origin + '/knowledge/leetcode/', wait_until='networkidle')
            page.locator('[data-random-toggle]').click()
            links = page.locator('.kb-random-note-link')
            order = links.evaluate_all('(nodes) => nodes.map(node => node.getAttribute("href"))')
            assert len(order) > 5
            links.first.click()
            page.wait_for_url(origin + order[0])
            navigation = page.locator('[data-random-navigation]')
            expect(navigation).to_be_visible()
            expect(page.locator('[data-random-progress]')).to_contain_text(f'1 / {len(order)}')
            next_link = page.locator('[data-random-next]')
            for index in range(1, 4):
                expect(next_link).to_be_visible()
                expect(next_link).to_have_attribute('href', order[index])
                next_link.click()
                page.wait_for_url(origin + order[index])
                expect(page.locator('[data-random-progress]')).to_contain_text(f'{index + 1} / {len(order)}')
            page.reload(wait_until='networkidle')
            expect(next_link).to_have_attribute('href', order[4])
            assert page.evaluate('document.documentElement.scrollWidth - innerWidth') <= 1
            page.screenshot(path=str(output / f'random-navigation-{width}.png'))
            page.go_back(wait_until='networkidle')
            expect(next_link).to_have_attribute('href', order[3])
            page.locator('[data-random-return]').click()
            expect(page.locator('[data-random-notes]')).to_be_visible()
            assert links.evaluate_all('(nodes) => nodes.map(node => node.getAttribute("href"))') == order
            page.locator('[data-random-refresh]').click()
            refreshed = links.evaluate_all('(nodes) => nodes.map(node => node.getAttribute("href"))')
            assert refreshed != order and set(refreshed) == set(order)
            links.nth(1).click()
            expect(next_link).to_have_attribute('href', refreshed[2])
            page.locator('[data-random-return]').click()
            expect(page.locator('[data-random-notes]')).to_be_visible()
            links.last.click()
            expect(navigation).to_be_visible()
            expect(next_link).not_to_be_visible()
            expect(page.locator('[data-random-end]')).to_be_visible()
            page.locator('[data-random-return]').click()
            expect(page.locator('[data-random-notes]')).to_be_visible()
            assert links.evaluate_all('(nodes) => nodes.map(node => node.getAttribute("href"))') == refreshed
            page.goto(origin + urlsplit(refreshed[0]).path, wait_until='networkidle')
            expect(page.locator('[data-random-progress]')).not_to_be_visible()
            expect(page.locator('[data-favorite-note]')).to_be_visible()
            page.goto(origin + '/knowledge/leetcode/', wait_until='networkidle')
            page.locator('[data-random-toggle]').click()
            page.goto(origin + refreshed[0], wait_until='networkidle')
            expect(page.locator('[data-random-progress]')).not_to_be_visible()
            assert not errors, errors
            context.close()
            print(f'Random navigation passed at {width}px: sequence, reload, history, reshuffle, last problem, normal browsing', flush=True)
        browser.close()
finally:
    server.shutdown()
