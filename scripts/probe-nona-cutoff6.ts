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
  await form.locator('button', { hasText: 'Pilih PSP' }).first().click();
  await webview.waitForTimeout(1500);

  // dump struktur dropdown PSP penuh
  const popover = webview.locator('[role="dialog"]:not(.el-picker__popper), [role="listbox"]');
  console.log('popovers:', await popover.count());
  await webview.screenshot({ path: '/tmp/psp-dropdown.png' });

  const ddHtml = (await webview.locator('body').innerHTML());
  const cmds = ddHtml.match(/data-slot="command"[\s\S]{0,200}?/);
  const searchIn = webview.locator('input[placeholder*="Cari" i], input[placeholder*="Pilih" i]');
  console.log('search inputs count:', await searchIn.count());
  for (let i = 0; i < await searchIn.count(); i++) {
    console.log(`searchIn[${i}] ph=${JSON.stringify(await searchIn.nth(i).getAttribute('placeholder'))} visible=${await searchIn.nth(i).isVisible()}`);
  }
  // coba ketik untuk search
  const visibleSearch = webview.locator('input[placeholder*="Cari" i]').last();
  if (await visibleSearch.count()) {
    await visibleSearch.fill('Mega');
    await webview.waitForTimeout(1000);
    console.log('after search Mega options:', JSON.stringify((await webview.locator('[role="option"]').allTextContents()).map((t) => t.trim()).filter(Boolean)));
    await visibleSearch.fill('QA DUMMY');
    await webview.waitForTimeout(1000);
    console.log('after search QA DUMMY options:', JSON.stringify((await webview.locator('[role="option"]').allTextContents()).map((t) => t.trim()).filter(Boolean)));
    console.log('empty msg?', JSON.stringify((await webview.locator('[role="option"]').allTextContents()).filter((t) => t.includes('tidak'))));
  } else {
    console.log('no visible search in dropdown');
  }

  await browser.close();
})();