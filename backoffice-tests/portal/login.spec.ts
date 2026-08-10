import { test, expect } from '@playwright/test';
import { AdminLoginPage } from '../../shared/pages/AdminLoginPage';
import usersData from '../../shared/test-data/users.json';
import backofficeData from '../../shared/test-data/backoffice.json';

/**
 * Studi kasus: Back Office - Form Authentication
 * Target: portal backoffice playground milik project Anda
 */

const admin = usersData.backoffice.admin;
const data = backofficeData.login;

// Spesifikasi ini menguji alur login, harus mulai dari session kosong
// (tanpa storageState dari project backoffice yang sudah login).
test.use({ storageState: { cookies: [], origins: [] } });

test.describe.configure({ mode: 'serial' });

test.describe('Back Office - Login @regression', () => {
  test('Login dengan kredensial valid harus berhasil @smoke @critical', async ({ page }) => {
    const loginPage = new AdminLoginPage(page);
    await loginPage.goto();
    await loginPage.login(admin.email, admin.password);

    await expect(loginPage.captchaDialog).toBeVisible();
    await loginPage.bypassCaptcha();

    await loginPage.submitOtp(data.otp_dummy);
    await expect(page.getByText('Pilih BOT Anda')).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/https:\/\/iconnet-portal-backoffice-playground\.lentera-app\.id\/?$/);
  });

  test('Login dengan password salah harus menampilkan error @smoke', async ({ page }) => {
    const loginPage = new AdminLoginPage(page);
    await loginPage.goto();
    await loginPage.login(admin.email, data.invalid_password);

    await expect(loginPage.captchaDialog).toBeVisible();
    await loginPage.bypassCaptcha();
    await expect(page.getByText('Email atau password salah')).toBeVisible();
  });

  test('Login dengan email kosong harus menampilkan button disabled @smoke', async ({ page }) => {
    const loginPage = new AdminLoginPage(page);
    await loginPage.goto();
    await loginPage.emailInput.fill('');
    await loginPage.passwordInput.fill(admin.password);

    await expect(loginPage.loginButton).toBeDisabled();
  });

  test('Login dengan password kosong harus menampilkan button disabled', async ({ page }) => {
    const loginPage = new AdminLoginPage(page);
    await loginPage.goto();
    await loginPage.emailInput.fill(admin.email);
    await loginPage.passwordInput.fill('');

    await expect(loginPage.loginButton).toBeDisabled();
  });

  test('Landing page setelah login harus menampilkan daftar BOT @smoke', async ({ page }) => {
    const loginPage = new AdminLoginPage(page);
    await loginPage.goto();
    await loginPage.login(admin.email, admin.password);

    await expect(loginPage.captchaDialog).toBeVisible();
    await loginPage.bypassCaptcha();
    await loginPage.submitOtp(data.otp_dummy);

    await expect(page.getByText('Pilih BOT Anda')).toBeVisible();
    await expect(page.getByText('BOT ICONNET')).toBeVisible();
  });
});
