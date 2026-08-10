import { test as setup, expect } from '@playwright/test';
import usersData from './shared/test-data/users.json';
import backofficeData from './shared/test-data/backoffice.json';

const admin = usersData.backoffice.admin;
const data = backofficeData.login;

/**
 * Setup login PORTAL (1x) lalu simpan session ke .auth/portal.json.
 * Semua test backoffice portal memakai session ini (tidak login berulang).
 */
setup('Portal BOT - login & simpan session', async ({ page }) => {
  for (let attempt = 1; attempt <= 5; attempt++) {
    await page.goto('/login');
    await page.getByPlaceholder('Masukan email kamu').fill(admin.email);
    await page.getByPlaceholder('Masukan kata sandi kamu').fill(admin.password);
    await page.getByRole('button', { name: 'Login' }).click();

    try {
      const instruction = page.getByText(data.captcha_prompt);
      await instruction.waitFor({ state: 'visible', timeout: 15000 });
      await instruction.locator('span').first().click();

      const otpInputs = page.locator('input[autocomplete="one-time-code"]');
      await otpInputs.first().waitFor({ state: 'visible', timeout: 35000 });
      const digits = data.otp_dummy.split('');
      for (let i = 0; i < digits.length; i++) {
        await otpInputs.nth(i).fill(digits[i]);
      }
      if (await page.locator('#pin-input').count()) {
        await page.locator('#pin-input').fill(data.otp_dummy);
      }
      await page.keyboard.press('Enter');

      await expect(page.getByText('Pilih BOT Anda')).toBeVisible({ timeout: 20000 });
      await page.getByRole('button', { name: 'Masuk' }).first().click({ force: true });
      await expect(page.getByRole('button', { name: 'Master Data' })).toBeVisible({ timeout: 30000 });

      await page.context().storageState({ path: '.auth/portal.json' });
      console.log('setup login portal berhasil, session disimpan');
      return;
    } catch {
      console.log(`setup login attempt ${attempt} gagal, retry...`);
    }
  }
  throw new Error('Setup login portal gagal setelah retry');
});
