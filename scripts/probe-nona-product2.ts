import { chromium } from '@playwright/test';
import { config } from '../config';

const WEBVIEW = 'https://backoffice-ppob-nona-webview-playground.lentera-app.id';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: '.auth/portal.json', baseURL: config.backoffice_base_url });
  const page = await context.newPage();
  let webview;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.goto('/');
      await page.getByText('Pilih BOT Anda').waitFor({ timeout: 15000 });
      const card = page.locator('div.p-4.border.rounded-lg', { hasText: 'BOT PPOB NONA' }).first();
      const popupPromise = page.waitForEvent('popup', { timeout: 20000 });
      await card.getByRole('button', { name: 'Masuk' }).click();
      webview = await popupPromise;
      await webview.waitForURL(/backoffice-ppob-nona-webview-playground\.lentera-app\.id\/?$/, { timeout: 30000 });
      await webview.waitForTimeout(1500);
      break;
    } catch { await page.waitForTimeout(2000); }
  }
  if (!webview) throw new Error('popup gagal');
  await webview.goto(WEBVIEW + '/master/product');
  await webview.waitForTimeout(3000);
  await webview.locator('main button', { hasText: 'Tambah Produk' }).click();
  await webview.waitForTimeout(2500);

  const form = webview.locator('main form').last();
  console.log('form count:', await webview.locator('main form').count());
  console.log('form html:', (await form.innerHTML().catch(() => 'NO')).replace(/\s+/g, ' ').slice(0, 3000));
  console.log('form buttons:', JSON.stringify((await form.locator('button').allTextContents()).map(t => t.trim()).filter(Boolean)));
  console.log('form switch:', await form.locator('[role="switch"]').count());
  console.log('save disabled:', await form.locator('button[type="submit"]').isDisabled().catch(() => 'n/a'));
  await browser.close();
})();
