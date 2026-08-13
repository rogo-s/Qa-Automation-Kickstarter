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
  await webview.goto(WEBVIEW + '/master/bank');
  await webview.waitForTimeout(2500);

  const nama = 'QA DEL2 ' + Date.now().toString().slice(-6);
  await webview.getByRole('button', { name: 'Tambah Bank' }).first().click();
  await webview.waitForTimeout(1000);
  await webview.locator('input[name="name"]').fill(nama);
  await webview.locator('input[name="code"]').fill('QD2' + Date.now().toString().slice(-5));
  await webview.locator('input[name="short_name"]').fill('QD2');
  await webview.locator('input[name="swift_code"]').fill('QD2CIDJB');
  await webview.locator('form button[type="submit"]').click();
  await webview.waitForTimeout(3000);

  await webview.locator('main input#search').fill(nama);
  await webview.waitForTimeout(1500);
  console.log('1. rows after create+search:', await webview.locator('main tbody tr').count());

  // network listener
  const requests: string[] = [];
  webview.on('request', (r) => { if (r.method() !== 'GET') requests.push(`${r.method()} ${r.url()}`); });

  await webview.locator('main tbody tr').first().getByRole('button', { name: 'Open menu' }).click();
  await webview.waitForTimeout(800);
  await webview.getByRole('menuitem', { name: 'Hapus' }).click();
  await webview.waitForTimeout(1500);
  const dialogCount = await webview.locator('[role="dialog"], [role="alertdialog"]').count();
  console.log('2. dialog count:', dialogCount);
  console.log('3. dialog text:', (await webview.locator('[role="dialog"], [role="alertdialog"]').last().textContent())?.replace(/\s+/g, ' ').trim());
  const lanjutkan = webview.getByRole('button', { name: 'Lanjutkan' });
  console.log('4. Lanjutkan count:', await lanjutkan.count());
  await lanjutkan.click();
  await webview.waitForTimeout(4000);
  console.log('5. dialog count setelah klik:', await webview.locator('[role="dialog"], [role="alertdialog"]').count());
  console.log('6. requests non-GET:', JSON.stringify(requests));

  // toast/error?
  const errs = await webview.locator('[role="alert"], .text-red-500, .text-destructive').allTextContents();
  console.log('7. error text:', JSON.stringify(errs));

  await browser.close();
})();