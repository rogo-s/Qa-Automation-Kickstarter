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

  // 1) Buat dummy bank via menu Bank
  const bankName = 'QA DUMMY BANK ' + Date.now().toString().slice(-6);
  const bankCode = 'QADB' + Date.now().toString().slice(-4);
  console.log('BANK:', bankName, bankCode);
  await webview.goto(WEBVIEW + '/master/bank');
  await webview.waitForTimeout(2500);
  await webview.getByRole('button', { name: 'Tambah Bank' }).first().click();
  await webview.waitForTimeout(1200);
  await webview.locator('form input[name="name"]').fill(bankName);
  await webview.locator('form input[name="code"]').fill(bankCode);
  await webview.locator('form input[name="short_name"]').fill('QADB');
  await webview.locator('form input[name="swift_code"]').fill('QADBCIDJ1');
  await webview.locator('form button[type="submit"]').click();
  await webview.waitForTimeout(2500);

  // 2) Buka menu Cutoff, form tambah, cek dropdown PSP
  await webview.goto(WEBVIEW + '/master/cutoff');
  await webview.waitForTimeout(2500);
  await webview.locator('main button', { hasText: /Tambah Cutoff/i }).click();
  await webview.waitForTimeout(2000);
  const form = webview.locator('form').last();
  await form.locator('button', { hasText: 'Pilih PSP' }).first().click();
  await webview.waitForTimeout(1500);
  const pspOpts = await webview.locator('[role="option"]').allTextContents();
  console.log('PSP OPTIONS:', JSON.stringify(pspOpts.map((t) => t.trim()).filter(Boolean)));
  console.log('DUMMY ADA?', pspOpts.some((t) => t.includes('QA DUMMY')));
  // cek apakah ada search di dropdown
  const ddInput = webview.locator('[role="combobox"], [role="listbox"] input, input[placeholder*="cari" i]');
  console.log('dropdown search inputs:', await ddInput.count());
  await webview.screenshot({ path: '/tmp/psp-dropdown.png' });

  await browser.close();
})();