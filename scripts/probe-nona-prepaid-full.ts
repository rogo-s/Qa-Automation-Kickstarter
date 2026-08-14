import { chromium } from '@playwright/test';

const WEBVIEW = 'https://ppob-nona-webview-playground.lentera-app.id';
const step = (m: string) => console.log('\n===== ' + m + ' =====');
const dump = async (page: any) => {
  console.log('URL:', page.url());
  const text = (await page.locator('body').innerText()).split('\n').map(t=>t.trim()).filter(Boolean);
  console.log('BODY:', JSON.stringify(text.slice(0, 70)));
  console.log('BUTTONS:', (await page.locator('button').allTextContents()).map(t=>t.trim()).filter(Boolean).slice(0,20));
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: '.auth/webview-nona.json', baseURL: WEBVIEW });
  const page = await context.newPage();
  page.on('request', r => { if (r.url().includes('/api/')) console.log('REQ', r.method(), r.url().replace(WEBVIEW, '')); });
  page.on('response', r => { if (r.url().includes('/api/')) console.log('RES', r.status(), r.url().replace(WEBVIEW, '')); });

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

  // pilih token 5rb dulu (harusnya jadi selected)
  await page.getByRole('button', { name: 'Rp 5.000,00', exact: true }).click();
  await page.waitForTimeout(1000);

  // klik pilih metode
  await page.getByRole('button', { name: /Pilih Metode Pembayaran/ }).first().click();
  await page.waitForTimeout(1500);

  // pilih Bank Mandiri (radio/label/button)
  const mandiri = page.locator('text=Bank Mandiri').last();
  await mandiri.click();
  await page.waitForTimeout(1000);
  step('AFTER PILIH MANDIRI');
  await dump(page);

  // klik Bayar Sekarang
  await page.getByRole('button', { name: 'Bayar Sekarang', exact: true }).click();
  await page.waitForTimeout(5000);
  step('AFTER BAYAR SEKARANG');
  await dump(page);

  await browser.close();
})();
