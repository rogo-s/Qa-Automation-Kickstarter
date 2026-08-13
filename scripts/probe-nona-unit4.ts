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
  await webview.goto(WEBVIEW + '/master/unit');
  await webview.waitForTimeout(3000);

  const UNIQ = Date.now().toString().slice(-5);
  const kode = 'QAUNIT' + UNIQ;
  const nama = 'QA UNIT ' + UNIQ;
  const search = webview.locator('main input#search');

  // klik baris langsung -> edit?
  const row = webview.locator('main tbody tr').first();
  console.log('row tag:', await row.evaluate(el => el.tagName));
  await row.getByRole('button', { name: 'Open menu' }).click();
  await webview.waitForTimeout(800);
  console.log('menu (row1):', JSON.stringify((await webview.locator('[role="menuitem"]').allTextContents()).map(t => t.trim())));
  await webview.keyboard.press('Escape');
  await webview.waitForTimeout(600);

  // klik sel nama / row body?
  await row.locator('td').nth(2).click();
  await webview.waitForTimeout(1500);
  console.log('form after row click:', await webview.locator('main form').count());
  console.log('h2 after row click:', JSON.stringify((await webview.locator('main h2').allTextContents()).map(t => t.trim())));

  // coba klik label "Nama Unit" / double click
  await webview.locator('main tbody tr').first().locator('td').nth(2).dblclick();
  await webview.waitForTimeout(1500);
  console.log('form after dblclick:', await webview.locator('main form').count());

  // cek apakah ada toolbar row action lain (icon pensil)
  const r1 = webview.locator('main tbody tr').first();
  console.log('row icons/svg:', await r1.locator('svg').count());
  console.log('row html:', (await r1.innerHTML()).replace(/\s+/g, ' ').slice(0, 1200));
  await browser.close();
})();
