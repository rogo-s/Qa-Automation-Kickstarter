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
    '/master/cutoff',
    '/master/bank',
    '/master/settlement-bank-account',
  ];

  for (const path of pages) {
    await webview.goto(WEBVIEW + path);
    await webview.waitForTimeout(2500);
    const btn = webview.locator('main tbody tr').first().getByRole('button', { name: 'Open menu' });
    if (await btn.count()) {
      await btn.first().click();
      await webview.waitForTimeout(1000);
      const items = await webview.evaluate(() =>
        Array.from(document.querySelectorAll('[role="menuitem"]')).map((m) => m.textContent?.trim()),
      );
      console.log(`=== ${path} → actions: ${JSON.stringify(items)}`);
      await webview.keyboard.press('Escape');
      await webview.waitForTimeout(500);
    } else {
      console.log(`=== ${path} → tidak ada tombol Open menu`);
    }
  }

  await browser.close();
})();