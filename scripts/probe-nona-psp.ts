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
  await webview.waitForTimeout(4000);

  console.log('== HEADING ==');
  console.log((await webview.locator('main h1').textContent().catch(() => 'none'))?.trim());
  console.log('== TOOLBAR ==');
  const btns = await webview.locator('main button').all();
  for (const b of btns) {
    if (await b.isVisible()) console.log('visible btn:', JSON.stringify((await b.textContent())?.trim()));
  }
  console.log('== TABLE HEADERS ==');
  const headers = await webview.locator('main thead th, main thead td').allTextContents();
  console.log(headers.map((t) => t.trim()).filter(Boolean));
  console.log('== FIRST ROW ==');
  console.log((await webview.locator('main tbody tr').first().innerText().catch(() => 'NO ROW')).replace(/\n/g, ' | '));

  await browser.close();
})();