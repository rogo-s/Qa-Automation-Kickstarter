import { chromium } from '@playwright/test';
const WEBVIEW = 'https://ppob-nona-webview-playground.lentera-app.id';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: '.auth/webview-nona.json', baseURL: WEBVIEW });
  const page = await context.newPage();
  page.on('request', r => { if (r.url().includes('/api/')) console.log('REQ', r.method(), r.url().split('/api/')[1]); });
  page.on('response', r => { if (r.url().includes('/api/')) console.log('RES', r.status(), r.url().split('/api/')[1]); });
  page.on('requestfailed', r => { if (r.url().includes('/api/')) console.log('REQFAIL', r.failure()?.errorText, r.url().split('/api/')[1]); });
  for (const phone of ['081234567890', '089632331939']) {
    console.log('\n--- nohp:', phone, '---');
    await page.goto('/prepaid');
    await page.waitForTimeout(2500);
    await page.locator('input[type="text"]').nth(0).fill('322561241175');
    await page.locator('input[type="text"]').nth(1).fill(phone);
    await page.getByRole('button', { name: 'Lanjutkan', exact: true }).click();
    await page.waitForTimeout(8000);
    const text = (await page.locator('body').innerText()).split('\n').map(t=>t.trim()).filter(Boolean).slice(0,20);
    console.log('BODY:', JSON.stringify(text));
  }
  await browser.close();
})();
