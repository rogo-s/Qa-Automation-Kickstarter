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

  const selectTipe = async (t: string) => {
    await form.locator('button').filter({ hasText: /Tipe|Once|Daily|Weekly|Monthly/ }).first().click();
    await webview.waitForTimeout(1000);
    await webview.locator('[role="option"]', { hasText: t }).first().click();
    await webview.waitForTimeout(1200);
  };

  // ONCE -> date picker
  await selectTipe('Once');
  console.log('== ONCE DATE PICKER ==');
  await form.locator('button', { hasText: 'Pilih Tanggal' }).first().click();
  await webview.waitForTimeout(1500);
  console.log('dialog count:', await webview.getByRole('dialog').count());
  const cal = webview.locator('[role="dialog"]').last();
  console.log('calendar html:', (await cal.innerHTML().catch(() => 'NO')).replace(/\s+/g, ' ').slice(0, 1800));
  // grid hari
  const days = cal.locator('[role="gridcell"], td:not(.disabled), button[data-date], .el-date-table td');
  console.log('day cells:', await days.count());
  const cellTexts = (await days.allTextContents()).filter((t) => /^\d+$/.test(t.trim()));
  console.log('sample days:', JSON.stringify(cellTexts.slice(0, 10)));
  await webview.screenshot({ path: '/tmp/once-cal.png' });
  await webview.keyboard.press('Escape');
  await webview.waitForTimeout(600);

  // WEEKLY -> combobox hari
  await selectTipe('Weekly');
  console.log('== WEEK DAY ==');
  await form.locator('[role="combobox"]').last().click();
  await webview.waitForTimeout(1000);
  console.log('weekday options:', JSON.stringify((await webview.locator('[role="option"]').allTextContents()).map((t) => t.trim()).filter(Boolean)));
  await webview.keyboard.press('Escape');
  await webview.waitForTimeout(600);

  await browser.close();
})();