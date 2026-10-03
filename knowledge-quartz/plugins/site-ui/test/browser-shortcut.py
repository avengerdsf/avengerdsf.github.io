"""Search shortcuts must clear the directory modal before Quartz handles focus."""
import os
from playwright.sync_api import sync_playwright, expect
origin = os.environ.get('KB_PREVIEW_URL', 'http://127.0.0.1:4173').rstrip('/')
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(executable_path=os.environ.get('BROWSER_EXECUTABLE', r'C:\Program Files\Google\Chrome\Application\chrome.exe'))
    for shortcut in ['Control+k', 'Meta+k']:
        page = browser.new_page(viewport={'width':390,'height':844})
        page.goto(origin + '/knowledge/leetcode/hash-table/two-sum', wait_until='networkidle')
        page.locator('[data-directory-toggle]').click()
        expect(page.locator('.sidebar.left')).to_be_visible()
        page.keyboard.press(shortcut)
        search = page.locator('.search-space > input')
        expect(search).to_be_visible()
        expect(search).to_be_focused()
        expect(page.locator('[data-directory-toggle]')).to_have_attribute('aria-expanded', 'false')
        assert not page.locator('.center').evaluate('el => el.inert')
        assert not page.locator('html').evaluate("el => el.classList.contains('kb-scroll-locked')")
        search.fill('两数之和')
        expect(page.locator('.search-layout')).to_contain_text('两数之和')
        print(shortcut + ' passed', flush=True)
        page.close()
    browser.close()
