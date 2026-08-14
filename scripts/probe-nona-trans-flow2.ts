import { chromium } from '@playwright/test';

const WEBVIEW = 'https://ppob-nona-webview-playground.lentera-app.id';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: '.auth/webview-nona.json', baseURL: WEBVIEW });
  const page = await context.newPage();
  await page.goto('/prepaid');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);

  const inputs = page.locator('input[type="text"]');
  if (await inputs.count()) await inputs.nth(0).fill('530000000000'); // ID pelanggan
  if (await inputs.count() > 1) await inputs.nth(1).fill('081234567890'); // no HP
  await page.getByRole('button', { name: 'Lanjutkan' }).click();
  await page.waitForTimeout(3000);
  console.log('URL setelah Lanjutkan:', page.url());
  console.log('BODY:', (await page.locator('body').innerText()).split('\n').map(t=>t.trim()).filter(Boolean).slice(0,70));
  console.log('\nINPUTS:', await page.locator('input, select, textarea').evaluateAll(els => els.map(e => ({ tag: e.tagName, name: (e as HTMLInputElement).name, type: (e as HTMLInputElement).type, placeholder: (e as HTMLInputElement).placeholder }))));
  console.log('\nBUTTONS:', (await page.locator('button').allTextContents()).map(t=>t.trim()).filter(Boolean));

  // coba lanjut sampai konfirmasi/payment
  const lanjut = page.getByRole('button', { name: 'Lanjutkan' });
  if (await lanjut.count()) { await lanjut.first().click(); await page.waitForTimeout(3000);
    console.log('\n--- setelah Lanjutkan 2 ---'); console.log('URL:', page.url());
    console.log('BODY:', (await page.locator('body').innerText()).split('\n').map(t=>t.trim()).filter(Boolean).slice(0,70));
    console.log('BUTTONS:', (await page.locator('button').allTextContents()).map(t=>t.trim()).filter(Boolean));
  }

  await browser.close();
})();
