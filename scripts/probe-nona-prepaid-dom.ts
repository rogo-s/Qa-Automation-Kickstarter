import { chromium } from '@playwright/test';

const WEBVIEW = 'https://ppob-nona-webview-playground.lentera-app.id';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: '.auth/webview-nona.json', baseURL: WEBVIEW });
  const page = await context.newPage();

  await page.goto('/prepaid');
  await page.waitForTimeout(2000);
  await page.locator('input[type="text"]').nth(0).fill('322561241175');
  await page.locator('input[type="text"]').nth(1).fill('089632331938');
  await page.getByRole('button', { name: 'Lanjutkan' }).click();
  await page.waitForTimeout(3000);
  const boxes = page.locator('input[type="text"]');
  for (let i = 0; i < 6; i++) await boxes.nth(i).fill('0');
  await page.getByRole('button', { name: 'Verifikasi' }).click();
  await page.waitForTimeout(3500);

  await page.getByRole('button', { name: 'Rp 5.000,00', exact: true }).click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /Pilih Metode Pembayaran/ }).first().click();
  await page.waitForTimeout(1500);
  await page.locator('text=Bank Mandiri').last().click();
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Bayar Sekarang', exact: true }).click();
  await page.waitForTimeout(5000);

  console.log('=== DOM Nomor Virtual Account ===');
  const vaLabel = page.locator('text=Nomor Virtual Account').first();
  console.log('vaLabel count:', await vaLabel.count());
  if (await vaLabel.count()) {
    console.log('PARENT HTML:', (await vaLabel.evaluate(el => el.closest('div')?.outerHTML)).slice(0, 1500));
  }
  console.log('\n=== body text ===');
  console.log(JSON.stringify((await page.locator('body').innerText()).split('\n').map(t=>t.trim()).filter(Boolean)));

  await browser.close();
})();
