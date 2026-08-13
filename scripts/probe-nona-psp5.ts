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
  await webview.goto(WEBVIEW + '/master/psp');
  await webview.waitForTimeout(3000);
  await webview.locator('main button', { hasText: 'Tambah PSP' }).click();
  await webview.waitForTimeout(2500);

  const form = webview.locator('main form').last();
  const html = (await form.innerHTML()).replace(/\s+/g, ' ');
  // ambil label + field tersisa (mulai dari Integrator Secret)
  const i = html.indexOf('Integrator Secret');
  console.log('REST:', html.slice(i, i + 2500));
  console.log('---');
  console.log('form buttons:', JSON.stringify((await form.locator('button').allTextContents()).map(t => t.trim()).filter(Boolean)));
  console.log('form switch:', await form.locator('[role="switch"]').count());
  console.log('combobox:', await form.locator('[role="combobox"]').count());
  console.log('selects:', await form.locator('select').count());
  console.log('save disabled:', await form.locator('button[type="submit"]').isDisabled().catch(() => 'n/a'));
  await browser.close();
})();
