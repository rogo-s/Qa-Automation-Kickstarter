import { chromium } from '@playwright/test';

const WEBVIEW = 'https://ppob-nona-webview-playground.lentera-app.id';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: '.auth/webview-nona.json', baseURL: WEBVIEW });
  const page = await context.newPage();
  await page.goto('/select-service');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  console.log('URL:', page.url());
  console.log('BODY:', (await page.locator('body').innerText()).split('\n').map(t=>t.trim()).filter(Boolean).slice(0,40));

  // Klik "Pilih Layanan" pertama (Beli Token)
  const btns = page.getByRole('button', { name: 'Pilih Layanan' });
  const n = await btns.count();
  console.log('\n[Pilih Layanan] count:', n);
  if (n) {
    await btns.first().click();
    await page.waitForTimeout(2500);
    console.log('\nURL setelah pilih layanan:', page.url());
    console.log('BODY:', (await page.locator('body').innerText()).split('\n').map(t=>t.trim()).filter(Boolean).slice(0,60));
    console.log('\nINPUTS:', await page.locator('input, select, textarea').evaluateAll(els => els.map(e => ({ tag: e.tagName, name: (e as HTMLInputElement).name, type: (e as HTMLInputElement).type, placeholder: (e as HTMLInputElement).placeholder }))));
    console.log('\nBUTTONS:', await page.locator('button').allTextContents());
  }
  await browser.close();
})();
