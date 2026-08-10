import { test, expect } from '@playwright/test';
import { AdminLoginPage } from '../../shared/pages/AdminLoginPage';
import usersData from '../../shared/test-data/users.json';
import backofficeData from '../../shared/test-data/backoffice.json';

const admin = usersData.backoffice.admin;
const data = backofficeData.login;


test.describe.configure({ mode: 'serial' });

test.describe('Portal BOT - BOT Selector @regression', () => {
  test('Landing page portal harus menampilkan daftar BOT @smoke', async ({ page }) => {
    const loginPage = new AdminLoginPage(page);
    await loginPage.goto();
    await loginPage.login(admin.email, admin.password);

    await expect(loginPage.captchaDialog).toBeVisible();
    await loginPage.bypassCaptcha();
    await loginPage.submitOtp(data.otp_dummy);

    await expect(page.getByText('Pilih BOT Anda')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('BOT ICONNET')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Masuk' }).first()).toBeVisible({ timeout: 15000 });
  });
});
