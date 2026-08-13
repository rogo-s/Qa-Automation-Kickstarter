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
  await webview.goto(WEBVIEW + '/master/menu');
  await webview.waitForTimeout(3000);
  await webview.locator('main button', { hasText: 'Tambah Menu' }).click();
  await webview.waitForTimeout(2500);
  const form = webview.locator('main form').last();
  const html = (await form.innerHTML()).replace(/\s+/g, ' ');
  const i = html.indexOf('Actions / Permissions');
  console.log('REST:', html.slice(i, i + 2500));
  console.log('form buttons:', JSON.stringify((await form.locator('button').allTextContents()).map(t => t.trim()).filter(Boolean)));
  console.log('switch:', await form.locator('[role="switch"]').count());
  console.log('save disabled:', await form.locator('button[type="submit"]').isDisabled().catch(() => 'n/a'));

  // Parent dropdown options
  console.log('-- Parent --');
  await form.locator('button', { hasText: 'Pilih parent menu' }).click();
  await webview.waitForTimeout(1500);
  console.log('parent options:', JSON.stringify((await webview.locator('[role="option"]').allTextContents()).map(t => t.trim()).filter(Boolean)));
  await webview.keyboard.press('Escape');
  await webview.waitForTimeout(500);

  // Urutan dropdown options
  console.log('-- Urutan --');
  await form.locator('button', { hasText: 'Default' }).click();
  await webview.waitForTimeout(1500);
  console.log('urutan options:', JSON.stringify((await webview.locator('[role="option"]').allTextContents()).map(t => t.trim()).filter(Boolean)));
  await webview.keyboard.press('Escape');
  await webview.waitForTimeout(500);
  await browser.close();
})();
