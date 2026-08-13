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
    } catch (err) {
      console.log(`popup attempt ${attempt} failed: ${(err as Error).message.slice(0, 80)}`);
      await page.waitForTimeout(3000);
    }
  }
  if (!webview) throw new Error('popup gagal dibuka');

  await webview.goto(WEBVIEW + '/master/bank');
  await webview.waitForTimeout(3000);

  console.log('== HEADING & TOOLBAR ==');
  console.log((await webview.locator('main').innerHTML()).slice(0, 1200).replace(/\s+/g, ' '));

  console.log('== TABLE HEADERS ==');
  const headers = await webview.locator('main thead th, main thead td').allTextContents();
  console.log(headers.map((t) => t.trim()).filter(Boolean));

  console.log('== FIRST ROW ==');
  const row = await webview.locator('main tbody tr').first().innerText().catch(() => 'NO ROW');
  console.log(row.replace(/\n/g, ' | '));

  // Cek aksi row
  console.log('== ROW ACTION MENU ==');
  const menuBtn = webview.locator('main tbody tr').first().getByRole('button', { name: 'Open menu' });
  if (await menuBtn.count()) {
    await menuBtn.click();
    await webview.waitForTimeout(800);
    const items = await webview.getByRole('menuitem').allTextContents();
    console.log(items.map((t) => t.trim()));
    await webview.keyboard.press('Escape');
    await webview.waitForTimeout(500);
  }

  // Cek search / filter
  console.log('== SEARCH/FILTER ==');
  const search = webview.locator('main input[placeholder*="Cari"]').count();
  const filterBtn = webview.getByRole('button', { name: 'Filter' }).count();
  console.log('searchInputs:', await search, 'filterButtons:', await filterBtn);

  // Form Tambah
  console.log('== ADD FORM ==');
  const allBtns = await webview.locator('main button').all();
  for (const b of allBtns) {
    const t = (await b.textContent())?.trim();
    if (t) console.log('main button:', JSON.stringify(t));
  }
  const addBtn = webview.getByRole('button', { name: 'Tambah Bank' });
  console.log('Tambah Bank count:', await addBtn.count());
  await addBtn.first().click();
  await webview.waitForTimeout(2000);
  const dialogs = webview.getByRole('dialog');
  console.log('dialog count:', await dialogs.count());
  const dialogHtml = await dialogs.first().innerHTML().catch(() => 'NO DIALOG');
  console.log('DIALOG HTML:', dialogHtml.slice(0, 3500).replace(/\s+/g, ' '));

  console.log('== BODY AFTER CLICK ==');
  const bodyHtml = (await webview.locator('body').innerHTML()).replace(/\s+/g, ' ');
  const maybeForm = bodyHtml.match(/<form[^>]*>[\s\S]*?<\/form>/)?.[0] ?? 'no form tag';
  console.log('FORM TAG:', maybeForm.slice(0, 2500));
  // input di body selain search sidebar
  const bodyInputs = webview.locator('body input');
  for (let i = 0; i < await bodyInputs.count(); i++) {
    const inp = bodyInputs.nth(i);
    const name = (await inp.getAttribute('name')) || '';
    const ph = (await inp.getAttribute('placeholder')) || '';
    if (name !== 'search') console.log(`bodyInput[${i}] name=${name} placeholder=${JSON.stringify(ph)}`);
  }

  // Cek tombol Simpan saat kosong
  const saveBtn = dialogs.first().getByRole('button', { name: 'Simpan' });
  console.log('save disabled (kosong):', await saveBtn.isDisabled().catch(() => 'err'));
  const inputs = dialogs.first().locator('input');
  for (let i = 0; i < await inputs.count(); i++) {
    const inp = inputs.nth(i);
    console.log(`input[${i}] name=${await inp.getAttribute('name')} placeholder=${JSON.stringify(await inp.getAttribute('placeholder'))}`);
  }
  const selects = dialogs.first().locator('[role="combobox"], select');
  console.log('combobox count:', await selects.count());
  const switches = dialogs.first().getByRole('switch');
  console.log('switch count:', await switches.count(), 'state:', await switches.first().getAttribute('data-state').catch(() => 'none'));

  await browser.close();
})();
