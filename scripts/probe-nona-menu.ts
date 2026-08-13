import { chromium } from '@playwright/test';
import { config } from '../config';

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
      await webview.waitForTimeout(2000);
      break;
    } catch { await page.waitForTimeout(2000); }
  }
  if (!webview) throw new Error('popup gagal');
  await webview.waitForTimeout(1500);
  const groups = webview.locator('[data-sidebar="group-label"]');
  const groupNames = await groups.allTextContents();
  for (let i = 0; i < await groups.count(); i++) {
    const label = (groupNames[i] || '').trim();
    const menu = groups.nth(i).locator('xpath=following-sibling::div').first();
    const items = await menu.locator('[data-sidebar="menu-button"], a').allTextContents();
    console.log(`GROUP [${label}]:`, JSON.stringify(items.map(t => t.trim()).filter(Boolean)));
  }
  await browser.close();
})();
