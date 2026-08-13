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

  const search = webview.locator('main input#search');
  // data dari probe sebelumnya (masih ada? kode QAUNIT99351)
  await search.fill('99351');
  await webview.waitForTimeout(1500);
  console.log('rows for 99351:', await webview.locator('main tbody tr').count());
  if (await webview.locator('main tbody tr').count() > 0) {
    console.log('row:', JSON.stringify((await webview.locator('main tbody tr').first().innerText()).replace(/\n/g, ' | ')));
    await webview.locator('main tbody tr').first().getByRole('button', { name: 'Open menu' }).click();
    await webview.waitForTimeout(800);
    console.log('menu QA row:', JSON.stringify((await webview.locator('[role="menuitem"]').allTextContents()).map(t => t.trim())));
    await webview.keyboard.press('Escape');
    await webview.waitForTimeout(600);
  }

  // Filter
  await search.fill('');
  await webview.waitForTimeout(1000);
  const filterBtn = webview.locator('main button').filter({ hasText: 'Filter' });
  console.log('filter btn:', await filterBtn.count());
  if (await filterBtn.count() > 0) {
    await filterBtn.click();
    await webview.waitForTimeout(1500);
    console.log('filter panel html:', (await webview.locator('main').innerHTML()).replace(/\s+/g, ' ').slice(-2000));
    const chk = await webview.locator('[role="checkbox"]').allTextContents();
    console.log('filter checkboxes:', JSON.stringify(chk));
    await webview.keyboard.press('Escape');
    await webview.waitForTimeout(600);
  }
  await browser.close();
})();
