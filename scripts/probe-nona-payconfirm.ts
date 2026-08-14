import { chromium } from '@playwright/test';
const WEBVIEW = 'https://ppob-nona-webview-playground.lentera-app.id';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: '.auth/webview-nona.json', baseURL: WEBVIEW });
  const page = await context.newPage();
  page.on('response', async r => {
    if (r.url().includes('/api/') && r.request().method() === 'POST') {
      const path = r.url().split('/api/')[1] || '';
      if (/payment-confirm|order/.test(path)) {
        let b = '';
        try { b = JSON.stringify(await r.json()); } catch { b = '<non-json>'; }
        console.log('\nRES', r.status(), path, '\n', b.slice(0, 2000));
      }
    }
  });
  // langsung ke prepaid flow sampai payment-confirm
  await page.goto('/prepaid');
  await page.waitForTimeout(2000);
  await page.locator('input[type="text"]').nth(0).fill('322561241175');
  await page.locator('input[type="text"]').nth(1).fill('087789307941');
  await page.getByRole('button', { name: 'Lanjutkan', exact: true }).click();
  await page.getByText('Masukan Kode OTP').waitFor({ state: 'visible', timeout: 15000 });
  const boxes = page.locator('input[type="text"]');
  for (let i = 0; i < 6; i++) await boxes.nth(i).fill('0');
  await page.getByRole('button', { name: 'Verifikasi', exact: true }).click();
  await page.getByText('Informasi Pelanggan').waitFor({ state: 'visible', timeout: 15000 });
  await page.getByRole('button', { name: 'Rp 5.000,00', exact: true }).click();
  await page.getByRole('button', { name: /Pilih Metode Pembayaran/ }).first().click();
  await page.waitForTimeout(1200);
  await page.locator('text=Bank Mandiri').last().click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: 'Bayar Sekarang', exact: true }).click();
  await page.waitForTimeout(6000);
  console.log('\nPAGE VA:', JSON.stringify((await page.locator('body').innerText()).split('\n').map(t=>t.trim()).filter(Boolean).slice(12,20)));
  await browser.close();
})();
