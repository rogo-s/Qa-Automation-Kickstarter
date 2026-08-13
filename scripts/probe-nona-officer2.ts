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
  await webview.goto(WEBVIEW + '/master/officer');
  await webview.waitForTimeout(2500);

  const save = () => webview.locator('form button[type="submit"]');

  console.log('== VALIDASI ==');
  await webview.getByRole('button', { name: 'Tambah Officer' }).click();
  await webview.waitForTimeout(1200);
  console.log('kosong → disabled:', await save().isDisabled());
  await webview.locator('input[name="name"]').fill('QA Officer X');
  console.log('name saja → disabled:', await save().isDisabled());
  await webview.locator('input[name="email"]').fill('qaofficer@yopmail.com');
  console.log('name+email → disabled:', await save().isDisabled());
  await webview.locator('input[name="password"]').fill('Rahasia123');
  await webview.waitForTimeout(600);
  console.log('semua diisi → disabled:', await save().isDisabled());

  // create unik
  const email = 'qaoff' + Date.now().toString().slice(-6) + '@yopmail.com';
  await webview.locator('input[name="name"]').fill('QA OFF ' + Date.now().toString().slice(-5));
  await webview.locator('input[name="email"]').fill(email);
  await webview.locator('input[name="password"]').fill('Rahasia123');
  await save().click();
  await webview.waitForTimeout(2500);
  console.log('setelah simpan heading:', (await webview.locator('main h1').textContent())?.trim());

  // search
  console.log('== SEARCH ==');
  await webview.locator('main input[placeholder*="Cari" i]').first().fill(email.split('@')[0]);
  await webview.waitForTimeout(1500);
  console.log('hasil:', JSON.stringify((await webview.locator('main tbody tr').allTextContents()).map((r) => r.replace(/\s+/g, ' '))));

  console.log('== FILTER (sebelum edit) ==');
  await webview.getByRole('button', { name: 'Filter' }).click();
  await webview.waitForTimeout(1500);
  console.log('filter dialog text:', (await webview.locator('[role="dialog"]').textContent().catch(() => 'NO DIALOG'))?.replace(/\s+/g, ' ').trim());
  console.log('filter dialog HTML:', (await webview.locator('[role="dialog"]').innerHTML().catch(() => 'NO'))?.replace(/\s+/g, ' ').slice(0, 1500));
  await webview.keyboard.press('Escape');
  await webview.waitForTimeout(800);

  // edit form fields
  console.log('== EDIT ==');
  await webview.locator('main input[placeholder*="Cari" i]').first().fill(email.split('@')[0]);
  await webview.waitForTimeout(1200);
  await webview.locator('main tbody tr').first().getByRole('button', { name: 'Open menu' }).click();
  await webview.waitForTimeout(800);
  await webview.getByRole('menuitem', { name: 'Ubah' }).click();
  await webview.waitForTimeout(1500);
  console.log('form inputs:', JSON.stringify(await webview.locator('form input').evaluateAll((els) => els.map((e) => ({ name: e.getAttribute('name'), val: (e as HTMLInputElement).value })))));
  console.log('switch state:', await webview.locator('form [role="switch"]').getAttribute('data-state'));
  console.log('save disabled (edit):', await save().isDisabled());
  // ganti nama lalu simpan (form inline tidak bisa di-escape)
  await webview.locator('input[name="name"]').fill('QA OFF EDITED ' + Date.now().toString().slice(-4));
  await webview.waitForTimeout(600);
  await save().click();
  await webview.waitForTimeout(2500);
  console.log('setelah edit save heading:', (await webview.locator('main h1').textContent())?.trim());

  // delete
  console.log('== DELETE ==');
  await webview.locator('main input[placeholder*="Cari" i]').first().fill(email.split('@')[0]);
  await webview.waitForTimeout(1500);
  const r2 = webview.locator('main tbody tr').first();
  await r2.getByRole('button', { name: 'Open menu' }).click();
  await webview.waitForTimeout(800);
  await webview.getByRole('menuitem', { name: 'Hapus' }).click();
  await webview.waitForTimeout(1200);
  console.log('dialog text:', (await webview.locator('[role="dialog"], [role="alertdialog"]').last().textContent())?.replace(/\s+/g, ' ').trim());
  await webview.getByRole('button', { name: 'Lanjutkan' }).click();
  await webview.waitForTimeout(2500);
  await webview.locator('main input[placeholder*="Cari" i]').first().fill(email.split('@')[0]);
  await webview.waitForTimeout(1500);
  console.log('tbody setelah hapus:', JSON.stringify((await webview.locator('main tbody').textContent())?.trim().slice(0, 80)));

  await browser.close();
})();