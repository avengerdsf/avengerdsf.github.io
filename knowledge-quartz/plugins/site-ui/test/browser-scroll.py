"""Fresh-page regression for explorer positioning; run against the built preview."""
import json
import os
from urllib.parse import quote
from playwright.sync_api import sync_playwright

origin = os.environ.get('KB_PREVIEW_URL', 'http://127.0.0.1:4173').rstrip('/')
path = '/knowledge/machine-learning/chapter_01_supervised_learning/01_learning_regression'
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(executable_path=os.environ.get('BROWSER_EXECUTABLE', r'C:\Program Files\Google\Chrome\Application\chrome.exe'))
    for width in [1024, 1440, 2048]:
        page = browser.new_page(viewport={'width': width, 'height': 1000})
        page.goto(origin + path, wait_until='networkidle')
        page.wait_for_timeout(500)
        bounds = page.evaluate('''() => ({scroll: scrollY, title: document.querySelector('.article-title').getBoundingClientRect().top, toolbar: document.querySelector('.page-header > header').getBoundingClientRect().bottom, left: document.querySelector('.sidebar.left').getBoundingClientRect().right, center: document.querySelector('.center').getBoundingClientRect().left})''')
        assert bounds['scroll'] == 0, (width, bounds)
        assert bounds['title'] >= bounds['toolbar'], (width, bounds)
        assert 16 <= bounds['center'] - bounds['left'] <= 28, (width, bounds)
        # Overflow belongs to the tree, while the article keeps its scroll position.
        page.evaluate("document.querySelectorAll('.folder-outer').forEach(folder => folder.classList.add('open'))")
        tree = page.locator('.explorer-content')
        page.wait_for_function("document.querySelector('.explorer-content').scrollHeight > document.querySelector('.explorer-content').clientHeight")
        tree.evaluate('el => el.scrollTop = el.scrollHeight')
        assert page.evaluate('scrollY') == 0
        assert tree.evaluate('el => el.scrollTop') > 0
        # A direct authored anchor must retain its own scroll target.
        heading = page.locator('article h2[id]').first
        anchor = heading.get_attribute('id')
        page.goto(origin + path + '#' + quote(anchor), wait_until='networkidle')
        page.wait_for_timeout(500)
        anchor_y = page.locator('[id="' + anchor + '"]').bounding_box()['y']
        assert page.evaluate('scrollY') > 0, (width, anchor)
        assert anchor_y >= bounds['toolbar'], (width, anchor, anchor_y)
        print(json.dumps({'width': width, 'initial': bounds, 'anchor': anchor, 'anchor_y': anchor_y}), flush=True)
        page.close()
    browser.close()
