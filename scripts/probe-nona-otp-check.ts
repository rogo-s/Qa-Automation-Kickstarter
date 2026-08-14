import { chromium } from '@playwright/test';

const WEBVIEW = 'https://ppob-nona-webview-playground.lentera-app.id';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ baseURL: WEBVIEW });
  await page.goto('/login');
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      await page.locator('input[name="email"]').waitFor({ state: 'visible', timeout: 15000 });
      await page.locator('input[name="email"]').fill('rendi.nona@yopmail.com');
      await page.locator('input[name="password"]').fill('Password@123');
      await page.getByRole('button', { name: 'Masuk', exact: true }).click();
      const instruction = page.getByText('Lakukan perintah captcha dengan benar');
      await instruction.waitFor({ state: 'visible', timeout: 15000 });
      await instruction.locator('span').first().click();
      await page.waitForTimeout(4000);
      console.log('URL sekarang:', page.url());
      console.log('BODY setelah captcha:', (await page.locator('body').innerText()).split('\n').map(t=>t.trim()).filter(Boolean).slice(0,40));
      break;
    } catch (e) {
      console.log(`attempt ${attempt} gagal: ${(e as Error).message}`);
      await page.waitForTimeout(2000);
    }
  }
  await browser.close();
})();
