import { chromium } from '@playwright/test';
const WEBVIEW = 'https://ppob-nona-webview-playground.lentera-app.id';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: '.auth/webview-nona.json', baseURL: WEBVIEW });
  const page = await context.newPage();
  page.on('request', r => { if (r.url().includes('/api/')) console.log('REQ', r.method(), r.url().split('/api/')[1]); });
  page.on('response', r => { if (r.url().includes('/api/')) console.log('RES', r.status(), r.url().split('/api/')[1]); });
  page.on('requestfailed', r => { if (r.url().includes('/api/')) console.log('REQFAIL', r.failure()?.errorText, r.url().split('/api/')[1]); });
  // cek dashboard / select-service (endpoint ringan)
  await page.goto('/select-service');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(6000);
  console.log('SELECT-SERVICE BODY:', JSON.stringify((await page.locator('body').innerText()).split('\n').map(t=>t.trim()).filter(Boolean).slice(0,15)));
  // cek riwayat transaksi (endpoint GET)
  const hist = page.getByText('Riwayat Transaksi').first();
  if (await hist.count()) { await hist.click(); await page.waitForTimeout(4000);
    console.log('URL:', page.url());
    console.log('HISTORY BODY:', JSON.stringify((await page.locator('body').innerText()).split('\n').map(t=>t.trim()).filter(Boolean).slice(0,20)));
  }
  await browser.close();
})();
