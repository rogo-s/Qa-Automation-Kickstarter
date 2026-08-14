import { chromium } from '@playwright/test';

const WEBVIEW = 'https://ppob-nona-webview-playground.lentera-app.id';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: '.auth/webview-nona.json', baseURL: WEBVIEW });
  const page = await context.newPage();
  page.on('request', r => { if (r.url().includes('/api/')) console.log('REQ', r.method(), r.url().split('/api/')[1]); });
  page.on('response', async r => {
    if (r.url().includes('/api/') && r.request().method() !== 'GET') {
      let b = '';
      try { const j = await r.json(); b = (j.responseMessage || JSON.stringify(j)).slice(0, 250); } catch { b = '<non-json>'; }
      console.log('RES', r.status(), r.url().split('/api/')[1], '->', b);
    }
  });

  for (const id of ['233024234703', '321324234746']) {
    console.log('\n===== POSTPAID ID:', id, '=====');
    await page.goto('/postpaid');
    await page.waitForTimeout(2000);
    await page.locator('input[type="text"]').nth(0).fill(id);
    await page.locator('input[type="text"]').nth(1).fill('089632331938');
    await page.getByRole('button', { name: 'Lanjutkan', exact: true }).click();
    await page.waitForTimeout(6000);
    console.log('BODY:', JSON.stringify((await page.locator('body').innerText()).split('\n').map(t=>t.trim()).filter(Boolean).slice(0,40)));
  }

  await browser.close();
})();
