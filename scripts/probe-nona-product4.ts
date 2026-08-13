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
  const form = () => webview.locator('main form').last();
  await webview.locator('main button', { hasText: 'Tambah Produk' }).click();
  await webview.waitForTimeout(2000);
  const save = () => form().locator('button[type="submit"]').isDisabled();
  console.log('empty disabled:', await save());
  await form().locator('input[name="code"]').fill('P1');
  await webview.waitForTimeout(600);
  console.log('code only disabled:', await save());
  await form().locator('input[name="name"]').fill('Produk 1');
  await webview.waitForTimeout(600);
  console.log('code+name disabled:', await save());
  await form().locator('textarea[name="description"]').fill('Desc');
  await webview.waitForTimeout(600);
  console.log('all disabled:', await save());
  // cek apakah description punya required attr
  const desc = form().locator('textarea[name="description"]');
  console.log('desc required:', await desc.getAttribute('aria-required'));
  const code = form().locator('input[name="code"]');
  console.log('code required:', await code.getAttribute('aria-required'));
  const name = form().locator('input[name="name"]');
  console.log('name required:', await name.getAttribute('aria-required'));
  await browser.close();
})();
