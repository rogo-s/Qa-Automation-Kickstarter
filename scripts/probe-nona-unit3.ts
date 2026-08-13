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
  await webview.goto(WEBVIEW + '/master/unit');
  await webview.waitForTimeout(3000);

  const UNIQ = Date.now().toString().slice(-5);
  const kode = 'QAUNIT' + UNIQ;
  const nama = 'QA UNIT ' + UNIQ;
  console.log('kode:', kode);

  const form = () => webview.locator('main form').last();
  await webview.locator('main button', { hasText: 'Tambah Unit' }).click();
  await webview.waitForTimeout(2000);
  await form().locator('input[name="code"]').fill(kode);
  await form().locator('input[name="name"]').fill(nama);
  await form().locator('textarea[name="address"]').fill('Jl. Test QA No. 1');
  await webview.waitForTimeout(800);
  console.log('save disabled after fill:', await form().locator('button[type="submit"]').isDisabled());
  await form().locator('button[type="submit"]').click();
  await webview.waitForTimeout(3000);
  console.log('h2 after save:', JSON.stringify((await webview.locator('main h2').allTextContents()).map(t => t.trim())));

  // search
  const search = webview.locator('main input#search');
  await search.fill(UNIQ);
  await webview.waitForTimeout(1500);
  console.log('row:', JSON.stringify((await webview.locator('main tbody tr').first().innerText().catch(() => 'NO')).replace(/\n/g, ' | ')));

  // EDIT
  console.log('== EDIT ==');
  await webview.locator('main tbody tr').first().getByRole('button', { name: 'Open menu' }).click();
  await webview.waitForTimeout(800);
  console.log('menu:', JSON.stringify((await webview.locator('[role="menuitem"]').allTextContents()).map(t => t.trim())));
  await webview.getByRole('menuitem', { name: 'Ubah' }).click();
  await webview.waitForTimeout(2000);
  console.log('edit code:', await form().locator('input[name="code"]').inputValue());
  console.log('edit name:', await form().locator('input[name="name"]').inputValue());
  console.log('edit addr:', await form().locator('textarea[name="address"]').inputValue());
  console.log('edit switch:', await form().locator('[role="switch"]').getAttribute('data-state'));
  await form().locator('input[name="name"]').fill(nama + 'X');
  await form().locator('button[type="submit"]').click();
  await webview.waitForTimeout(3000);

  // DELETE
  console.log('== DELETE ==');
  await search.fill(UNIQ);
  await webview.waitForTimeout(1500);
  await webview.locator('main tbody tr').first().getByRole('button', { name: 'Open menu' }).click();
  await webview.waitForTimeout(800);
  await webview.getByRole('menuitem', { name: 'Hapus' }).click();
  await webview.waitForTimeout(1200);
  console.log('dialog:', (await webview.locator('[role="dialog"], [role="alertdialog"]').last().textContent())?.replace(/\s+/g, ' ').trim());
  const btns = await webview.locator('[role="dialog"], [role="alertdialog"]').last().getByRole('button').allTextContents();
  console.log('dialog buttons:', JSON.stringify(btns.map(t => t.trim())));
  await webview.getByRole('button', { name: 'Lanjutkan' }).click();
  await webview.waitForTimeout(2500);
  await webview.reload();
  await webview.waitForTimeout(2500);
  await search.fill(UNIQ);
  await webview.waitForTimeout(1500);
  console.log('tbody after delete+reload:', JSON.stringify((await webview.locator('main tbody').textContent())?.trim().slice(0, 60)));
  await browser.close();
})();
