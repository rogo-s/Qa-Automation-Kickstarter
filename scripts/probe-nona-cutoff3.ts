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

  console.log('== TIPE dropdown ==');
  const tipeBtn = form.locator('button', { hasText: 'Pilih Tipe' }).first();
  await tipeBtn.click();
  await webview.waitForTimeout(1200);
  const options = webview.locator('[role="option"], [role="menuitem"]');
  console.log('options:', JSON.stringify(await options.allTextContents()));
  // dump listbox
  const lb = webview.locator('[role="listbox"]');
  console.log('listbox count:', await lb.count());
  if (await lb.count()) console.log('listbox html:', (await lb.first().innerHTML()).replace(/\s+/g, ' ').slice(0, 1200));
  await webview.keyboard.press('Escape');
  await webview.waitForTimeout(600);

  console.log('== PSP dropdown ==');
  await form.locator('button', { hasText: 'Pilih PSP' }).first().click();
  await webview.waitForTimeout(1500);
  const pspOpts = webview.locator('[role="option"]');
  console.log('psp options:', JSON.stringify(await pspOpts.allTextContents()));
  const pspLb = webview.locator('[role="listbox"]');
  if (await pspLb.count()) console.log('psp listbox html:', (await pspLb.last().innerHTML()).replace(/\s+/g, ' ').slice(0, 1500));
  await webview.keyboard.press('Escape');
  await webview.waitForTimeout(600);

  console.log('== TIME PICKER Waktu Mulai ==');
  const timeInputs = form.locator('input[role="combobox"]');
  console.log('time inputs:', await timeInputs.count());
  const t0 = timeInputs.first();
  await t0.click();
  await webview.waitForTimeout(1500);
  // Element Plus time picker panel
  const panel = webview.locator('.el-picker-panel, .el-time-panel');
  console.log('panel count:', await panel.count());
  if (await panel.count()) console.log('panel html:', (await panel.first().innerHTML()).replace(/\s+/g, ' ').slice(0, 2500));
  await webview.keyboard.press('Escape');
  await webview.waitForTimeout(600);

  await browser.close();
})();