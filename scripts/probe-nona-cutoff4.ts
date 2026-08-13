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
  await webview.goto(WEBVIEW + '/master/cutoff');
  await webview.waitForTimeout(2500);
  await webview.locator('main button', { hasText: /Tambah Cutoff/i }).click();
  await webview.waitForTimeout(3000);

  console.log('=== form count:', await webview.locator('form').count());
  const forms = webview.locator('form');
  for (let i = 0; i < await forms.count(); i++) {
    const btns = await forms.nth(i).locator('button').allTextContents();
    console.log(`form[${i}] btns:`, JSON.stringify(btns.map((t) => t.trim()).filter(Boolean)));
  }
  console.log('=== body-level Pilih Tipe buttons:', await webview.getByRole('button', { name: /Pilih Tipe/i }).count());
  console.log('=== body-level Pilih PSP buttons:', await webview.getByRole('button', { name: /Pilih PSP/i }).count());
  console.log('=== body-level Pilih buttons:', await webview.locator('button', { hasText: /Pilih/ }).count());
  const h1 = await webview.locator('main h1').textContent();
  console.log('h1:', h1?.trim());

  await browser.close();
})();