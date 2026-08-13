import { chromium } from '@playwright/test';
import { config } from '../config';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: '.auth/portal.json', baseURL: config.backoffice_base_url });
  const page = await context.newPage();
  await page.goto('/');
  await page.getByText('Pilih BOT Anda').waitFor({ timeout: 15000 });
  const card = page.locator('div.p-4.border.rounded-lg', { hasText: 'BOT PPOB NONA' }).first();
  const popupPromise = page.waitForEvent('popup');
  await card.getByRole('button', { name: 'Masuk' }).click();
  const webview = await popupPromise;
  await webview.waitForURL(/backoffice-ppob-nona-webview-playground\.lentera-app\.id\/?$/, { timeout: 30000 });
  await webview.waitForTimeout(1500);

  const links = await webview.evaluate(() =>
    Array.from(document.querySelectorAll('a[href], [role="menuitem"], nav a'))
      .map((a) => ({ text: a.textContent?.trim(), href: a.getAttribute('href') }))
      .filter((x) => x.text && x.text.length < 40),
  );
  console.log('=== NAV LINKS ===');
  console.log(JSON.stringify(links, null, 1));

  const headings = await webview.evaluate(() =>
    Array.from(document.querySelectorAll('h1, h2, h3')).map((h) => h.textContent?.trim()),
  );
  console.log('=== HEADINGS ===', JSON.stringify(headings));

  await browser.close();
})();