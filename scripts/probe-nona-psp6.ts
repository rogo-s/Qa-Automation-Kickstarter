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
  await webview.locator('main button', { hasText: 'Tambah PSP' }).click();
  await webview.waitForTimeout(2500);
  const form = webview.locator('main form').last();
  const save = () => form.locator('button[type="submit"]').isDisabled();

  // cek name dari amount inputs
  const amountInputs = form.locator('input[placeholder="0"]');
  console.log('amount inputs:', await amountInputs.count());
  for (const a of await amountInputs.all()) {
    console.log('  amount name:', await a.getAttribute('name'));
  }

  // dropdown Rekening
  console.log('-- Pilih Rekening --');
  await form.locator('button', { hasText: 'Pilih Rekening' }).click();
  await webview.waitForTimeout(1500);
  const opts = webview.locator('[role="option"], [role="listbox"] *');
  console.log('options:', JSON.stringify((await webview.locator('[role="option"]').allTextContents()).map(t => t.trim()).filter(Boolean)));
  await webview.keyboard.press('Escape');
  await webview.waitForTimeout(500);

  // dropdown Tipe Settlement
  console.log('-- Pilih Tipe Settlement --');
  await form.locator('button', { hasText: 'Pilih Tipe Settlement' }).click();
  await webview.waitForTimeout(1500);
  console.log('tipe options:', JSON.stringify((await webview.locator('[role="option"]').allTextContents()).map(t => t.trim()).filter(Boolean)));
  await webview.keyboard.press('Escape');
  await webview.waitForTimeout(500);

  await browser.close();
})();
