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
  await webview.waitForTimeout(4000);

  console.log('== ADD PSP ==');
  await webview.getByRole('button', { name: 'Tambah PSP' }).click();
  await webview.waitForTimeout(3000);
  console.log('dialog count:', await webview.getByRole('dialog').count());
  console.log('form count:', await webview.locator('form').count());
  const form = webview.locator('form').last();
  console.log('form btns:', JSON.stringify((await form.locator('button').allTextContents()).map((t) => t.trim()).filter(Boolean)));
  console.log('-- inputs --');
  const ins = form.locator('input');
  for (let i = 0; i < await ins.count(); i++) {
    const inp = ins.nth(i);
    console.log(`input[${i}] name=${await inp.getAttribute('name')} type=${await inp.getAttribute('type')} ph=${JSON.stringify(await inp.getAttribute('placeholder'))}`);
  }
  console.log('combobox:', await form.locator('[role="combobox"]').count());
  console.log('switch:', await form.locator('[role="switch"]').count());
  const saveBtn = form.locator('button[type="submit"]');
  console.log('save exists:', await saveBtn.count(), 'disabled:', await saveBtn.first().isDisabled().catch(() => 'n/a'));

  // cek combobox tipe
  if (await form.locator('button', { hasText: /Pilih/i }).count()) {
    await form.locator('button', { hasText: /Pilih/i }).first().click();
    await webview.waitForTimeout(1200);
    console.log('options:', JSON.stringify((await webview.locator('[role="option"]').allTextContents()).map((t) => t.trim()).filter(Boolean)));
  }

  await browser.close();
})();