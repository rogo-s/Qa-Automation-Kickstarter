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
  console.log('KODE:', kode);

  await form.locator('input[name="name"]').fill(nama);
  await form.locator('input[name="code"]').fill(kode);
  await form.locator('button').filter({ hasText: /Tipe|Once|Daily|Weekly|Monthly/ }).first().click();
  await webview.waitForTimeout(1000);
  await webview.locator('[role="option"]', { hasText: 'Daily' }).first().click();
  await webview.waitForTimeout(1200);

  const setTime = async (ph: string, val: string) => {
    const inp = form.locator(`input[placeholder="${ph}"]`).first();
    await inp.click();
    await webview.waitForTimeout(600);
    await webview.keyboard.press('ControlOrMeta+A');
    await webview.keyboard.type(val);
    await webview.waitForTimeout(600);
    await webview.keyboard.press('Enter');
    await webview.waitForTimeout(600);
  };
  await setTime('Pilih waktu', '13:30:00');
  await setTime('Pilih Durasi', '02:00:00');

  await form.locator('button', { hasText: 'Pilih PSP' }).first().click();
  await webview.waitForTimeout(1500);
  await webview.locator('[role="option"]', { hasText: 'Bank Mega' }).first().click();
  await webview.waitForTimeout(1000);

  await form.locator('[role="switch"]').click({ force: true });
  await webview.waitForTimeout(500);
  await form.locator('button[type="submit"]').click();
  await webview.waitForTimeout(3000);
  console.log('h1 setelah save:', (await webview.locator('main h1').textContent().catch(() => 'none'))?.trim());

  // search
  const search = webview.locator('main input[placeholder*="Cari" i]').first();
  await search.fill(nama.split(' ')[2]);
  await webview.waitForTimeout(1500);
  console.log('row:', JSON.stringify((await webview.locator('main tbody tr').first().innerText().catch(() => 'NO'))?.replace(/\n/g, ' | ')));

  // EDIT: buka form edit
  console.log('== EDIT ==');
  await webview.locator('main tbody tr').first().getByRole('button', { name: 'Open menu' }).click();
  await webview.waitForTimeout(800);
  await webview.getByRole('menuitem', { name: 'Ubah' }).click();
  await webview.waitForTimeout(1500);
  const ef = webview.locator('form').last();
  console.log('edit name val:', await ef.locator('input[name="name"]').inputValue());
  console.log('edit code val:', await ef.locator('input[name="code"]').inputValue());
  console.log('edit waktu:', await ef.locator('input[placeholder="Pilih waktu"]').inputValue());
  console.log('edit durasi:', await ef.locator('input[placeholder="Pilih Durasi"]').inputValue());
  console.log('edit psp btn:', (await ef.locator('button').filter({ hasText: /Bank/ }).first().textContent())?.trim());
  console.log('edit switch:', await ef.locator('[role="switch"]').getAttribute('data-state'));
  // ganti nama
  await ef.locator('input[name="name"]').fill(nama + 'X');
  await ef.locator('button[type="submit"]').click();
  await webview.waitForTimeout(3000);

  // HAPUS
  console.log('== DELETE ==');
  await search.fill(nama.split(' ')[2]);
  await webview.waitForTimeout(1500);
  await webview.locator('main tbody tr').first().getByRole('button', { name: 'Open menu' }).click();
  await webview.waitForTimeout(800);
  await webview.getByRole('menuitem', { name: 'Hapus' }).click();
  await webview.waitForTimeout(1200);
  console.log('dialog:', (await webview.locator('[role="dialog"], [role="alertdialog"]').last().textContent())?.replace(/\s+/g, ' ').trim());
  await webview.getByRole('button', { name: 'Lanjutkan' }).click();
  await webview.waitForTimeout(2000);
  await search.fill(nama.split(' ')[2]);
  await webview.waitForTimeout(1500);
  console.log('tbody:', JSON.stringify((await webview.locator('main tbody').textContent())?.trim().slice(0, 40)));

  await browser.close();
})();