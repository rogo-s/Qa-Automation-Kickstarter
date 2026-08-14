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

  const hrefs = await webview.locator('[data-sidebar="menu-button"], a').evaluateAll(nodes =>
    nodes.map(n => ({ text: (n.textContent || '').trim(), href: (n as HTMLAnchorElement).href || '' }))
  );
  console.log('SIDEBAR LINKS:', JSON.stringify(hrefs.filter(h => h.href), null, 2));

  for (const h of hrefs) {
    if (!h.href) continue;
    if (/dashboard|recapitulation|monitoring|refund|data-gateway|gate|rekon|biller|psp/i.test(h.href)) {
      try {
        await webview.goto(h.href);
        await webview.waitForLoadState('domcontentloaded');
        await webview.waitForTimeout(1500);
        const url = webview.url();
        const h1 = (await webview.locator('h1, h2').allTextContents()).map(t => t.trim()).join(' | ');
        const inputs = (await webview.locator('main input, main textarea, main select, main button').allTextContents().then(
          () => webview.locator('main input, main textarea, main select').count()
        ));
        const hasUpload = await webview.locator('input[type="file"]').count();
        const hasTable = await webview.locator('main table').count();
        const btns = (await webview.locator('main button').allTextContents()).map(t => t.trim()).filter(Boolean).slice(0, 12);
        console.log(`\nPAGE [${url}]\n  heading: ${h1}\n  fields: ${inputs}  upload:${hasUpload} table:${hasTable}\n  buttons: ${JSON.stringify(btns)}`);
      } catch (e) { console.log(`\nPAGE [${h.href}] GAGAL: ${(e as Error).message}`); }
      await webview.waitForTimeout(500);
    }
  }
  await browser.close();
})();