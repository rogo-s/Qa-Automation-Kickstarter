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

  const selectTipe = async (tipe: string) => {
    const tipeBtn = form.locator('button').filter({ hasText: /Tipe|Once|Daily|Weekly|Monthly/ }).first();
    await tipeBtn.click();
    await webview.waitForTimeout(1000);
    await webview.locator('[role="option"]', { hasText: tipe }).first().click();
    await webview.waitForTimeout(1200);
  };

  for (const tipe of ['Once', 'Daily', 'Weekly', 'Monthly']) {
    await selectTipe(tipe);
    console.log(`\n===== TIPE ${tipe} =====`);
    const labels = (await form.locator('label').allTextContents()).map((t) => t.trim()).filter(Boolean);
    console.log('labels:', JSON.stringify(labels));
    const html = (await form.innerHTML()).replace(/\s+/g, ' ');
    require('fs').writeFileSync(`/tmp/cutoff-${tipe.toLowerCase()}.html`, html);
    // cek semua elemen input/select/button dalam form
    const elems = await form.locator('input, [role="combobox"], [role="switch"]').evaluateAll((els) =>
      els.map((e) => {
        const tag = e.tagName;
        const name = e.getAttribute('name');
        const ph = e.getAttribute('placeholder');
        const cls = e.getAttribute('class') || '';
        return `${tag}${name ? '#' + name : ''}${ph ? ' ph=' + JSON.stringify(ph) : ''}${cls.includes('el-input') ? ' [el-input]' : ''}`;
      }),
    );
    console.log('form elems:', JSON.stringify(elems));
  }

  await browser.close();
})();