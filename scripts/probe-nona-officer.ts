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

  console.log('== HEADING ==');
  console.log((await webview.locator('main h1').textContent().catch(() => 'none'))?.trim());

  console.log('== TOOLBAR (buttons + search/filter) ==');
  const btns = await webview.locator('main button').all();
  for (const b of btns) {
    if (await b.isVisible()) console.log('visible btn:', JSON.stringify((await b.textContent())?.trim()));
  }
  console.log('search inputs:', await webview.locator('main input[placeholder*="Cari" i]').count());
  console.log('filter btns:', await webview.getByRole('button', { name: 'Filter' }).count());

  console.log('== TABLE HEADERS ==');
  const headers = await webview.locator('main thead th, main thead td').allTextContents();
  console.log(headers.map((t) => t.trim()).filter(Boolean));

  console.log('== FIRST ROW ==');
  console.log((await webview.locator('main tbody tr').first().innerText().catch(() => 'NO ROW')).replace(/\n/g, ' | '));

  console.log('== ROW ACTION MENU ==');
  const menuBtn = webview.locator('main tbody tr').first().getByRole('button', { name: 'Open menu' });
  if (await menuBtn.count()) {
    await menuBtn.click();
    await webview.waitForTimeout(800);
    console.log(JSON.stringify((await webview.getByRole('menuitem').allTextContents()).map((t) => t.trim())));
    await webview.keyboard.press('Escape');
    await webview.waitForTimeout(500);
  }

  console.log('== ADD FORM ==');
  const addBtnTexts = ['Tambah Officer', 'Tambah Petugas'];
  let addBtn;
  for (const t of addBtnTexts) {
    const cand = webview.getByRole('button', { name: t });
    if (await cand.count()) { addBtn = cand.first(); console.log('add btn:', t); break; }
  }
  if (!addBtn) {
    const addCand = webview.locator('main button', { hasText: /Tambah/i }).first();
    console.log('add btn (regex):', JSON.stringify((await addCand.textContent())?.trim()));
    addBtn = addCand;
  }
  if (await addBtn.count()) {
    await addBtn.click();
    await webview.waitForTimeout(1500);
    console.log('dialog count:', await webview.getByRole('dialog').count());
    console.log('form count:', await webview.locator('form').count());
    const formHtml = (await webview.locator('form').last().innerHTML().catch(() => 'NO FORM')).replace(/\s+/g, ' ');
    console.log('FORM HTML:', formHtml.slice(0, 4000));
    console.log('-- form inputs --');
    const fmInputs = webview.locator('form').last().locator('input');
    for (let i = 0; i < await fmInputs.count(); i++) {
      const inp = fmInputs.nth(i);
      console.log(`input[${i}] name=${await inp.getAttribute('name')} ph=${JSON.stringify(await inp.getAttribute('placeholder'))}`);
    }
    console.log('-- form combobox/select --');
    console.log('combobox:', await webview.locator('form [role="combobox"], form select').count());
    console.log('-- switches --');
    console.log('switch:', await webview.locator('form [role="switch"]').count());
    const saveBtn = webview.locator('form button[type="submit"]');
    console.log('save exists:', await saveBtn.count(), 'disabled:', await saveBtn.first().isDisabled().catch(() => 'n/a'));
  }

  await browser.close();
})();