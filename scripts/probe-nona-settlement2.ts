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
  await webview.goto(WEBVIEW + '/master/settlement-bank-account');
  await webview.waitForTimeout(3000);

  const search = webview.locator('main input#search');
  const tbody = async () => {
    const rows = await webview.locator('main tbody tr').allInnerTexts();
    return rows.map(r => r.replace(/\t/g, ' ').replace(/\n/g, ' | '));
  };

  console.log('ALL (kosong):', JSON.stringify(await tbody(), null, 1));

  await search.fill('bni');
  await webview.waitForTimeout(1500);
  console.log('SEARCH bni:', JSON.stringify(await tbody()));

  await search.fill('mandiri');
  await webview.waitForTimeout(1500);
  console.log('SEARCH mandiri:', JSON.stringify(await tbody()));

  await search.fill('bca');
  await webview.waitForTimeout(1500);
  console.log('SEARCH bca:', JSON.stringify(await tbody()));

  await search.fill('zzz_none');
  await webview.waitForTimeout(1500);
  console.log('SEARCH zzz_none:', JSON.stringify(await tbody()));

  await search.fill('');
  await webview.waitForTimeout(1500);
  console.log('SEARCH kosong lagi:', JSON.stringify(await tbody()));
  await browser.close();
})();
