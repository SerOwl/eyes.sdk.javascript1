from playwright.sync_api import sync_playwright

from applitools.selenium import Eyes
from applitools.selenium.runner import PlaywrightRunner


def test_playwright_runner():
    runner = PlaywrightRunner()


def test_playwright_eyes_open():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        page.goto("http://whatsmyuseragent.org/")
        runner = PlaywrightRunner()
        eyes = Eyes(runner)
        eyes.open(page, "Playwright", "Eyes open test")
