import { chromium } from '@playwright/test';

const WEBVIEW = 'https://ppob-nona-webview-playground.lentera-app.id';
const step = (m: string) => console.log('\n===== ' + m + ' =====');
const dump = async (page: any) => {
  console.log('URL:', page.url());
  console.log('BODY:', JSON.stringify((await page.locator('body').innerText()).split('\n').map(t=>t.trim()).filter(Boolean).slice(0,60)));
  console.log('INPUTS:', await page.locator('input, select, textarea').evaluateAll(els => els.map(e => ({ tag: e.tagName, name: (e as HTMLInputElement).name, type: (e as HTMLInputElement).type, ph: (e as HTMLInputElement).placeholder }))));
  console.log('BUTTONS:', (await page.locator('button').allTextContents()).map(t=>t.trim()).filter(Boolean).slice(0,20));
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: '.auth/webview-nona.json', baseURL: WEBVIEW });
  const page = await context.newPage();
  page.on('request', r => { if (r.url().includes('/api/')) console.log('REQ', r.method(), r.url().split('/api/')[1]); });
  page.on('response', r => { if (r.url().includes('/api/')) console.log('RES', r.status(), r.url().split('/api/')[1]); });
  page.on('requestfailed', r => { if (r.url().includes('/api/')) console.log('REQFAIL', r.failure()?.errorText, r.url().split('/api/')[1]); });

  // cek route postpaid dari select-service
  await page.goto('/select-service');
  await page.waitForTimeout(2000);
  const links = await page.locator('a').evaluateAll(nodes => nodes.map(n => ({ text: (n.textContent||'').trim(), href: (n as HTMLAnchorElement).href })));
  console.log('LINKS:', JSON.stringify(links.filter(l => l.href)));

  // coba langsung /postpaid
  await page.goto('/postpaid');
  await page.waitForTimeout(2500);
  step('PAGE /postpaid');
  await dump(page);

  // isi data pelanggan postpaid
  await page.locator('input[type="text"]').nth(0).fill('211024234744');
  await page.locator('input[type="text"]').nth(1).fill('089632331938');
  await page.getByRole('button', { name: 'Lanjutkan', exact: true }).click();
  await page.waitForTimeout(6000);
  step('AFTER LANJUTKAN postpaid');
  await dump(page);

  await browser.close();
})();
