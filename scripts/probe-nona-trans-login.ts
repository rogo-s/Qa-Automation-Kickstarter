import { chromium } from '@playwright/test';

const WEBVIEW = 'https://ppob-nona-webview-playground.lentera-app.id';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ baseURL: WEBVIEW });
  page.on('request', r => { if (r.url().includes('/api/')) console.log('REQ', r.method(), r.url().replace(WEBVIEW, '')); });
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      await page.goto('/login');
      const email = page.locator('input[name="email"]');
      await email.waitFor({ state: 'visible', timeout: 20000 });
      await email.fill('rendi.nona@yopmail.com');
      await page.locator('input[name="password"]').fill('Password@123');
      await page.getByRole('button', { name: 'Masuk', exact: true }).click();

      const instruction = page.getByText('Lakukan perintah captcha dengan benar');
      await instruction.waitFor({ state: 'visible', timeout: 15000 });
      await instruction.locator('span').first().click();

      const otpInputs = page.locator('input[autocomplete="one-time-code"]');
      await otpInputs.first().waitFor({ state: 'visible', timeout: 35000 });
      for (let i = 0; i < 6; i++) await otpInputs.nth(i).fill('0');
      if (await page.locator('#pin-input').count()) await page.locator('#pin-input').fill('000000');
      await page.keyboard.press('Enter');

      await page.waitForURL((u) => !/\/login/.test(u.pathname), { timeout: 25000 });
      await page.waitForTimeout(2500);
      console.log('LOGIN OK, LANDING:', page.url());
      break;
    } catch (e) {
      console.log(`attempt ${attempt} gagal: ${(e as Error).message}`);
      await page.waitForTimeout(2000);
    }
  }
  await page.context().storageState({ path: '.auth/webview-nona.json' }).catch(() => {});
  await browser.close();
})();
