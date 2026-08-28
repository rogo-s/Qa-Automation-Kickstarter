import { test, expect } from '@playwright/test';
import { AdminLoginPage } from '../../../shared/pages/AdminLoginPage';
import { BotSelectorPage } from '../../../shared/pages/BotSelectorPage';
import usersData from '../../../shared/test-data/users.json';
import backofficeData from '../../../shared/test-data/backoffice.json';

const admin = usersData.backoffice.admin;
const data = backofficeData.login;

// Test menguji alur login penuh dari session kosong (tanpa storageState).
test.use({ storageState: { cookies: [], origins: [] } });

test.describe.configure({ mode: 'serial' });

test.describe('Portal BOT - Masuk ke BOT PPOB NONA @regression', () => {
  test('Login, pilih BOT PPOB NONA dari dashboard, lalu masuk ke webview BOT @smoke @critical', async ({ page }) => {
    const loginPage = new AdminLoginPage(page);
    await loginPage.goto();
    await loginPage.login(admin.email, admin.password);

    await expect(loginPage.captchaDialog).toBeVisible();
    await loginPage.bypassCaptcha();
    await loginPage.submitOtp(data.otp_dummy);

    // Dashboard / BOT selector menampilkan kartu BOT PPOB NONA.
    const selector = new BotSelectorPage(page);
    await expect(selector.heading).toBeVisible({ timeout: 15000 });
    await expect(selector.botCard('BOT PPOB NONA')).toBeVisible({ timeout: 15000 });
    await expect(selector.botCode('BOT PPOB NONA')).toHaveText('PPOBNONA');
    await expect(selector.botName('BOT PPOB NONA')).toHaveText('BOT PPOB NONA');

    // Klik Masuk membuka webview BOT di tab baru.
    const botPage = await selector.enterBot('BOT PPOB NONA');
    await botPage.waitForLoadState('domcontentloaded');
    // Popup mendarat di /sso/callback?jwt_token=... lalu di-redirect ke root.
    await botPage.waitForURL(/backoffice-ppob-nona-webview-playground\.lentera-app\.id\/?$/, {
      timeout: 30000,
    });
    await expect(botPage.getByText(/Selamat Datang/)).toBeVisible({ timeout: 15000 });
    await expect(
      botPage.getByRole('button', { name: 'Toggle Sidebar' }).first()
    ).toBeVisible();
  });
});
