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
  const search = webview.locator('main input#search');
  const form = () => webview.locator('main form').last();
  const setStatus = async (want: string) => {
    const sw = form().locator('[role="switch"]');
    const cur = await sw.getAttribute('data-state');
    console.log('  switch cur:', cur, '-> want:', want);
    if (cur !== want) {
      await sw.click({ force: true });
      await webview.waitForTimeout(600);
      console.log('  switch after click:', await sw.getAttribute('data-state'));
    }
  };
  const openEdit = async (kw: string) => {
    await search.fill(kw);
    await webview.waitForTimeout(1500);
    await webview.locator('main tbody tr').first().getByRole('button', { name: 'Open menu' }).click();
    await webview.waitForTimeout(800);
    await webview.getByRole('menuitem', { name: 'Ubah' }).click();
    await webview.waitForTimeout(2000);
  };

  // saat ini row berstatus Tidak Aktif -> aktifkan
  await openEdit('59480');
  await setStatus('checked');
  await form().locator('button[type="submit"]').click();
  await webview.waitForTimeout(3000);
  await search.fill('59480');
  await webview.waitForTimeout(1500);
  console.log('row:', JSON.stringify((await webview.locator('main tbody tr').first().innerText()).replace(/\n/g, ' | ')));
  await browser.close();
})();
