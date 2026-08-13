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

  console.log('URL:', webview.url());
  console.log('h1:', (await webview.locator('main h1').first().textContent().catch(() => 'none'))?.trim());
  console.log('h2:', JSON.stringify((await webview.locator('main h2').allTextContents()).map(t => t.trim()).filter(Boolean)));
  console.log('buttons:', JSON.stringify((await webview.locator('main button').allTextContents()).map(t => t.trim()).filter(Boolean).slice(0, 15)));
  console.log('inputs:', await webview.locator('main input').count());
  for (const inp of await webview.locator('main input').all()) {
    console.log('  input:', JSON.stringify({ id: await inp.getAttribute('id'), name: await inp.getAttribute('name'), ph: await inp.getAttribute('placeholder') }));
  }
  console.log('th:', JSON.stringify((await webview.locator('main th').allTextContents()).map(t => t.trim()).filter(Boolean)));
  console.log('rows:', await webview.locator('main tbody tr').count());
  if (await webview.locator('main tbody tr').count() > 0) {
    console.log('row1:', JSON.stringify((await webview.locator('main tbody tr').first().innerText()).replace(/\n/g, ' | ')));
    await webview.locator('main tbody tr').first().getByRole('button', { name: 'Open menu' }).click();
    await webview.waitForTimeout(800);
    console.log('menu row1:', JSON.stringify((await webview.locator('[role="menuitem"]').allTextContents()).map(t => t.trim())));
    await webview.keyboard.press('Escape');
    await webview.waitForTimeout(500);
  }
  await browser.close();
})();
