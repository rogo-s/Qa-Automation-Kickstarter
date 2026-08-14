import { chromium } from '@playwright/test';

const WEBVIEW = 'https://ppob-nona-webview-playground.lentera-app.id';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: '.auth/webview-nona.json', baseURL: WEBVIEW });
  const page = await context.newPage();
  page.on('request', r => { if (r.url().includes('/api/')) console.log('REQ', r.method(), r.url().split('/api/')[1]); });
  page.on('response', async r => { if (r.url().includes('/api/')) { let b=''; try { b=JSON.stringify(await r.json()).slice(0,300);} catch{} console.log('RES', r.status(), r.url().split('/api/')[1], '->', b.slice(0,200)); } });

  await page.goto('/transaction-history');
  await page.waitForTimeout(3000);
  console.log('BUTTONS:', (await page.locator('button').allTextContents()).map(t=>t.trim()).filter(Boolean));

  await page.locator('input[type="text"]').first().fill('211024234744');
  await page.getByRole('button', { name: 'Cari Transaksi' }).click();
  await page.waitForTimeout(5000);
  console.log('\n=== BODY setelah Cari ===');
  console.log('BODY:', JSON.stringify((await page.locator('body').innerText()).split('\n').map(t=>t.trim()).filter(Boolean).slice(0,50)));

  await browser.close();
})();
