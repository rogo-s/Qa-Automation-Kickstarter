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
  await webview.goto(WEBVIEW + '/master/psp');
  await webview.waitForTimeout(3000);
  const search = webview.locator('main input#search');
  await search.fill('19758');
  await webview.waitForTimeout(1500);
  console.log('rows:', await webview.locator('main tbody tr').count());
  const row = webview.locator('main tbody tr').first();
  await row.getByRole('button', { name: 'Open menu' }).click();
  await webview.waitForTimeout(800);
  console.log('menu:', JSON.stringify((await webview.locator('[role="menuitem"]').allTextContents()).map(t => t.trim())));

  // EDIT
  await webview.getByRole('menuitem', { name: 'Ubah' }).click();
  await webview.waitForTimeout(2500);
  const form = webview.locator('main form').last();
  console.log('edit code:', await form.locator('input[name="code"]').inputValue());
  console.log('edit fullName:', await form.locator('input[name="fullName"]').inputValue());
  console.log('edit rekening btn:', (await form.locator('button').filter({ hasText: 'Settlement' }).first().textContent())?.trim().slice(0, 50));
  console.log('edit tipe settlement btn:', (await form.locator('button').filter({ hasText: 'Bulk|Detail' }).first().textContent())?.trim());
  console.log('edit switch:', await form.locator('[role="switch"]').getAttribute('data-state'));
  console.log('edit save disabled:', await form.locator('button[type="submit"]').isDisabled());
  await form.locator('input[name="fullName"]').fill('QA PSP EDITED');
  console.log('save disabled after edit:', await form.locator('button[type="submit"]').isDisabled());
  await form.locator('button[type="submit"]').click();
  await webview.waitForTimeout(3000);
  await search.fill('19758');
  await webview.waitForTimeout(1500);
  console.log('row after edit:', JSON.stringify((await webview.locator('main tbody tr').first().innerText().catch(()=>'NO')).replace(/\n/g, ' | ')));

  // DELETE
  console.log('== DELETE ==');
  await webview.locator('main tbody tr').first().getByRole('button', { name: 'Open menu' }).click();
  await webview.waitForTimeout(800);
  await webview.getByRole('menuitem', { name: 'Hapus' }).click();
  await webview.waitForTimeout(1200);
  console.log('dialog:', (await webview.locator('[role="dialog"], [role="alertdialog"]').last().textContent())?.replace(/\s+/g, ' ').trim());
  await webview.getByRole('button', { name: 'Lanjutkan' }).click();
  await webview.waitForTimeout(2500);
  await webview.reload();
  await webview.waitForTimeout(2500);
  await search.fill('19758');
  await webview.waitForTimeout(1500);
  console.log('tbody after delete+reload:', JSON.stringify((await webview.locator('main tbody').textContent())?.trim().slice(0, 40)));
  await browser.close();
})();
