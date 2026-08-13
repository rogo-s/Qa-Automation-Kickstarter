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
  await webview.goto(WEBVIEW + '/master/cutoff');
  await webview.waitForTimeout(2500);
  await webview.locator('main button', { hasText: /Tambah Cutoff/i }).click();
  await webview.waitForTimeout(2000);
  const form = webview.locator('form').last();

  const kode = 'QACUT' + Date.now().toString().slice(-5);
  const nama = 'QA CUTOFF ' + Date.now().toString().slice(-5);

  // NAMA & KODE
  await form.locator('input[name="name"]').fill(nama);
  await form.locator('input[name="code"]').fill(kode);

  // TIPE Daily
  await form.locator('button').filter({ hasText: /Tipe|Once|Daily|Weekly|Monthly/ }).first().click();
  await webview.waitForTimeout(1000);
  await webview.locator('[role="option"]', { hasText: 'Daily' }).first().click();
  await webview.waitForTimeout(1200);

  // TIME PICKER via keyboard
  console.log('== TIME PICKER ==');
  const timeInputs = form.locator('input[placeholder="Pilih waktu"], [role="combobox"]');
  const t0 = form.locator('input[placeholder="Pilih waktu"]').first();
  await t0.click();
  await webview.waitForTimeout(800);
  await webview.keyboard.press('ControlOrMeta+A');
  await webview.keyboard.type('13:30:00');
  await webview.waitForTimeout(800);
  await webview.keyboard.press('Enter');
  await webview.waitForTimeout(800);
  console.log('waktu mulai value:', await t0.inputValue());

  const t1 = form.locator('input[placeholder="Pilih Durasi"]').first();
  await t1.click();
  await webview.waitForTimeout(800);
  await webview.keyboard.press('ControlOrMeta+A');
  await webview.keyboard.type('02:00:00');
  await webview.waitForTimeout(800);
  await webview.keyboard.press('Enter');
  await webview.waitForTimeout(800);
  console.log('durasi value:', await t1.inputValue());

  // PSP
  console.log('== PSP ==');
  await form.locator('button', { hasText: 'Pilih PSP' }).first().click();
  await webview.waitForTimeout(1500);
  await webview.locator('[role="option"]', { hasText: 'Bank Mega' }).first().click();
  await webview.waitForTimeout(1000);
  console.log('psp button text:', (await form.locator('button').filter({ hasText: /Bank/ }).first().textContent())?.trim());

  console.log('== SAVE ==');
  const saveBtn = form.locator('button[type="submit"]');
  console.log('save disabled:', await saveBtn.isDisabled());
  await saveBtn.click();
  await webview.waitForTimeout(3000);
  console.log('h1:', (await webview.locator('main h1').textContent().catch(() => 'none'))?.trim());

  // verifikasi via search
  console.log('== SEARCH ==');
  const search = webview.locator('main input[placeholder*="Cari" i]').first();
  await search.fill(nama.split(' ')[2]);
  await webview.waitForTimeout(1500);
  console.log('rows:', JSON.stringify((await webview.locator('main tbody tr').allTextContents()).map((r) => r.replace(/\s+/g, ' '))));

  await browser.close();
})();