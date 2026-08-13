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

  for (const tipe of ['Once', 'Daily', 'Weekly', 'Monthly']) {
    await form.locator('button', { hasText: 'Pilih Tipe' }).first().click();
    await webview.waitForTimeout(1000);
    await webview.locator('[role="option"]', { hasText: tipe }).first().click();
    await webview.waitForTimeout(1200);
    const labels = await form.locator('label').allTextContents();
    console.log(`--- TIPE ${tipe} → labels:`, JSON.stringify(labels.map((t) => t.trim()).filter(Boolean)));
    // cek input date / combo baru
    const dateInputs = form.locator('input[type="date"], input[placeholder*="tanggal" i]');
    console.log(`TIPE ${tipe} date inputs:`, await dateInputs.count());
    const inputs = form.locator('input');
    for (let i = 0; i < await inputs.count(); i++) {
      const inp = inputs.nth(i);
      if (await inp.isVisible()) console.log(`  input[${i}] type=${await inp.getAttribute('type')} name=${await inp.getAttribute('name')} ph=${JSON.stringify(await inp.getAttribute('placeholder'))} cls=${(await inp.getAttribute('class'))?.includes('el-input')}`);
    }
  }

  await browser.close();
})();