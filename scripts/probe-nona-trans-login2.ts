import { chromium } from '@playwright/test';

const WEBVIEW = 'https://ppob-nona-webview-playground.lentera-app.id';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ baseURL: WEBVIEW });
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  const html = await page.locator('body').innerHTML();
  console.log(html.slice(0, 4000));
  await browser.close();
})();
