import { chromium } from '@playwright/test';
import { config } from '../config';

const WEBVIEW = 'https://backoffice-ppob-nona-webview-playground.lentera-app.id';

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

  const pages = [
    '/master/denom',
    '/master/menu',
    '/master/psp',
    '/master/product',
    '/master/unit',
    '/master/officer',
    '/master/settlement-bank-account',
    '/master/cutoff',
    '/master/bank',
  ];

  for (const path of pages) {
    await webview.goto(WEBVIEW + path);
    await webview.waitForTimeout(2500);
    const info = await webview.evaluate(() => {
      const h = document.querySelector('main h1, main h2, main h3')?.textContent?.trim();
      const addBtns = Array.from(document.querySelectorAll('main button'))
        .filter((b) => /tambah|add/i.test(b.textContent || ''))
        .map((b) => b.textContent?.trim());
      const firstRow = document.querySelector('main tbody tr')?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 90);
      return { heading: h, addButtons: addBtns, firstRow };
    });
    console.log(`=== ${path} → heading: "${info.heading}" | add: ${JSON.stringify(info.addButtons)} | row: "${info.firstRow}"`);
  }

  await browser.close();
})();