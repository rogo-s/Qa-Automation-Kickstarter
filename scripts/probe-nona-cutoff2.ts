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
  const html = (await form.innerHTML()).replace(/\s+/g, ' ');
  // dump seluruh form HTML ke file
  require('fs').writeFileSync('/tmp/cutoff-form.html', html);
  console.log('FORM LEN:', html.length);
  console.log('COMBOS:', await form.locator('[role="combobox"]').count());
  for (let i = 0; i < await form.locator('[role="combobox"]').count(); i++) {
    const c = form.locator('[role="combobox"]').nth(i);
    console.log(`combo[${i}] ph=${JSON.stringify(await c.getAttribute('placeholder'))} id=${await c.getAttribute('id')}`);
  }
  // cek elemen lain: radio, select, checkbox
  console.log('radio:', await form.locator('input[type="radio"]').count());
  console.log('checkbox:', await form.locator('input[type="checkbox"]').count());
  console.log('select:', await form.locator('select').count());
  // teks tombol dalam form
  console.log('form buttons:', JSON.stringify((await form.locator('button').allTextContents()).map((t) => t.trim()).filter(Boolean)));
  // cari textarea atau button yang mungkin membuka dropdown bank/tipe
  const btns = await form.locator('button').all();
  for (const b of btns) {
    const cls = await b.getAttribute('class');
    const t = (await b.textContent())?.trim();
    if (t || cls?.includes('dropdown') || cls?.includes('select')) console.log(`btn class=${cls} text=${JSON.stringify(t)}`);
  }
  console.log('== DIALOG OTHER CHECK ==');
  console.log('page dialogs:', await webview.getByRole('dialog').count());
  // screenshot
  await webview.screenshot({ path: '/tmp/cutoff-form.png' });

  await browser.close();
})();