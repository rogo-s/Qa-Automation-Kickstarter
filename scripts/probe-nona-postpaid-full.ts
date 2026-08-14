import { chromium } from '@playwright/test';

const WEBVIEW = 'https://ppob-nona-webview-playground.lentera-app.id';
const step = (m: string) => console.log('\n===== ' + m + ' =====');
const dump = async (page: any) => {
  console.log('URL:', page.url());
  console.log('BODY:', JSON.stringify((await page.locator('body').innerText()).split('\n').map(t=>t.trim()).filter(Boolean).slice(0,70)));
  console.log('BUTTONS:', (await page.locator('button').allTextContents()).map(t=>t.trim()).filter(Boolean).slice(0,25));
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: '.auth/webview-nona.json', baseURL: WEBVIEW });
  const page = await context.newPage();
  page.on('request', r => { if (r.url().includes('/api/')) console.log('REQ', r.method(), r.url().split('/api/')[1]); });
  page.on('response', r => { if (r.url().includes('/api/')) console.log('RES', r.status(), r.url().split('/api/')[1]); });

  await page.goto('/postpaid');
  await page.waitForTimeout(2000);
  await page.locator('input[type="text"]').nth(0).fill('233024234703');
  await page.locator('input[type="text"]').nth(1).fill('089632331938');
  await page.getByRole('button', { name: 'Lanjutkan', exact: true }).click();
  await page.getByText('Masukan Kode OTP').waitFor({ state: 'visible', timeout: 15000 });
  const boxes = page.locator('input[type="text"]');
  for (let i = 0; i < 6; i++) await boxes.nth(i).fill('0');
  await page.getByRole('button', { name: 'Verifikasi', exact: true }).click();
  await page.getByText('Informasi Pelanggan').waitFor({ state: 'visible', timeout: 15000 });

  await page.getByRole('button', { name: /Pilih Metode Pembayaran/ }).first().click();
  await page.waitForTimeout(2000);
  step('SETELAH BUKA METODE');
  await dump(page);

  const mandiri = page.locator('text=Bank Mandiri').last();
  if (await mandiri.count()) { await mandiri.click(); await page.waitForTimeout(1000);
    step('SETELAH PILIH MANDIRI');
    console.log('BODY:', JSON.stringify((await page.locator('body').innerText()).split('\n').map(t=>t.trim()).filter(Boolean).slice(0,50)));
  }

  const bayar = page.getByRole('button', { name: 'Bayar Sekarang', exact: true });
  if (await bayar.count()) { await bayar.click(); await page.waitForTimeout(5000);
    step('SETELAH BAYAR SEKARANG');
    await dump(page);
  }

  await browser.close();
})();
