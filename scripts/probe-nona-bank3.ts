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

  const save = () => webview.locator('form button[type="submit"]');

  // BUKA FORM TAMBAH
  await webview.getByRole('button', { name: 'Tambah Bank' }).first().click();
  await webview.waitForTimeout(1200);

  // VALIDASI
  console.log('== VALIDASI ==');
  console.log('kosong → disabled:', await save().isDisabled());
  await webview.locator('input[name="name"]').fill('BANK X');
  console.log('isi name saja → disabled:', await save().isDisabled());
  await webview.locator('input[name="code"]').fill('BX');
  console.log('name+code → disabled:', await save().isDisabled());
  await webview.locator('input[name="short_name"]').fill('BX');
  await webview.locator('input[name="swift_code"]').fill('BXIDIDJ1');
  console.log('semua diisi → disabled:', await save().isDisabled());

  // Simpan data unik untuk edit & hapus
  const nama = 'QA BANK ' + Date.now().toString().slice(-6);
  await webview.locator('input[name="name"]').fill(nama);
  await webview.locator('input[name="code"]').fill('QA' + Date.now().toString().slice(-4));
  await webview.locator('input[name="short_name"]').fill('QAB');
  await webview.locator('input[name="swift_code"]').fill('QABCIDJ1');
  console.log('ISIAN:', nama);
  await save().click();
  await webview.waitForTimeout(2500);

  // Apakah kembali ke list? heading?
  console.log('== SETELAH SIMPAN ==');
  console.log('heading:', (await webview.locator('main h1').textContent().catch(() => 'none'))?.trim());
  const toast = await webview.locator('[role="status"], [role="alert"], .toast').count();
  console.log('toast count:', toast);

  // Search
  console.log('== SEARCH ==');
  await webview.locator('main input#search').fill(nama);
  await webview.waitForTimeout(1500);
  const rows = await webview.locator('main tbody tr').allTextContents();
  console.log('row results:', JSON.stringify(rows.map((r) => r.replace(/\s+/g, ' '))));

  // EDIT
  console.log('== EDIT ==');
  const firstRow = webview.locator('main tbody tr').first();
  await firstRow.getByRole('button', { name: 'Open menu' }).click();
  await webview.waitForTimeout(800);
  console.log('menuitems:', JSON.stringify(await webview.getByRole('menuitem').allTextContents()));
  await webview.getByRole('menuitem', { name: 'Ubah' }).click();
  await webview.waitForTimeout(1500);
  console.log('edit inputs:', JSON.stringify(await webview.locator('main input[name], form input').evaluateAll((els) => els.map((e) => ({ name: e.getAttribute('name'), value: (e as HTMLInputElement).value })))));
  // ganti nama singkat
  await webview.locator('input[name="short_name"]').fill('QAB2');
  console.log('simpan edit disabled:', await save().isDisabled());
  await save().click();
  await webview.waitForTimeout(2500);
  await webview.locator('main input#search').fill(nama);
  await webview.waitForTimeout(1500);
  console.log('after edit row:', JSON.stringify((await webview.locator('main tbody tr').allTextContents()).map((r) => r.replace(/\s+/g, ' '))));

  // HAPUS
  console.log('== HAPUS ==');
  const r2 = webview.locator('main tbody tr').first();
  await r2.getByRole('button', { name: 'Open menu' }).click();
  await webview.waitForTimeout(800);
  await webview.getByRole('menuitem', { name: 'Hapus' }).click();
  await webview.waitForTimeout(1200);
  console.log('dialog text:', (await webview.locator('[role="dialog"], [role="alertdialog"]').last().textContent().catch(() => 'none'))?.replace(/\s+/g, ' ').trim());
  console.log('dialog btns:', JSON.stringify(await webview.locator('[role="dialog"] button, [role="alertdialog"] button').allTextContents()));
  await webview.getByRole('button', { name: 'Lanjutkan' }).click().catch(async () => {});
  await webview.waitForTimeout(2000);
  await webview.locator('main input#search').fill(nama);
  await webview.waitForTimeout(1500);
  console.log('after delete rows:', await webview.locator('main tbody tr').count());

  await browser.close();
})();