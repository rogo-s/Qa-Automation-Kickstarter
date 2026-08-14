import { chromium } from '@playwright/test';

const WEBVIEW = 'https://ppob-nona-webview-playground.lentera-app.id';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: '.auth/webview-nona.json', baseURL: WEBVIEW });
  const page = await context.newPage();
  page.on('response', r => { if (r.url().includes('/api/') && r.request().method() !== 'GET') console.log('RES', r.status(), '/api/...' + (r.url().split('/api/')[1] || '')); });

  await page.goto('/prepaid');
  await page.waitForTimeout(2500);
  await page.locator('input[type="text"]').nth(0).fill('322561241175');
  await page.locator('input[type="text"]').nth(1).fill('089632331938');
  await page.getByRole('button', { name: 'Lanjutkan', exact: true }).click();
  // tunggu elemen Otp screen (bukan body text)
  await page.getByText('Masukan Kode OTP').waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForTimeout(1000);
  const boxes = page.locator('input[type="text"]');
  console.log('kotak OTP:', await boxes.count());
  if (await boxes.count() >= 7) {
    // 1x OTP salah
    for (let i = 0; i < 6; i++) await boxes.nth(i).fill('9');
    await page.getByRole('button', { name: 'Verifikasi', exact: true }).click();
    await page.getByText('Invalid otp').waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    console.log('BODY OTP salah:', JSON.stringify((await page.locator('body').innerText()).split('\n').map(t=>t.trim()).filter(Boolean).slice(0,22)));
    // lalu OTP benar
    const b2 = page.locator('input[type="text"]');
    for (let i = 0; i < 6; i++) await b2.nth(i).fill('0');
    await page.getByRole('button', { name: 'Verifikasi', exact: true }).click();
    await page.getByText('Informasi Pelanggan').waitFor({ state: 'visible', timeout: 15000 });
    console.log('OK: setelah OTP benar -> Informasi Pelanggan muncul');
  }
  await browser.close();
})();
