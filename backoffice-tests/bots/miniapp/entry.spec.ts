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

test.describe('Portal BOT - Masuk ke BOT MINIAPP @regression', () => {
  test('Login, pilih BOT Miniapp dari dashboard, lalu masuk ke webview BOT @smoke @critical', async ({ page }) => {
    const loginPage = new AdminLoginPage(page);
    await loginPage.goto();
    await loginPage.login(admin.email, admin.password);

    await expect(loginPage.captchaDialog).toBeVisible();
    await loginPage.bypassCaptcha();
    await loginPage.submitOtp(data.otp_dummy);

    // Dashboard / BOT selector menampilkan kartu BOT Miniapp.
    const selector = new BotSelectorPage(page);
    await expect(selector.heading).toBeVisible({ timeout: 15000 });
    await expect(selector.botCard('BOT Miniapp')).toBeVisible({ timeout: 15000 });
    await expect(selector.botCode('BOT Miniapp')).toHaveText('MINIAPP');
    await expect(selector.botName('BOT Miniapp')).toHaveText('BOT Miniapp');

    // Klik Masuk membuka webview BOT di tab baru.
    const botPage = await selector.enterBot('BOT Miniapp');
    await botPage.waitForLoadState('domcontentloaded');
    // Popup mendarat di /sso/callback?jwt_token=... lalu di-redirect ke dashboard.
    await botPage.waitForURL(/miniapps-dashboard-internal-playground\.lentera-app\.id\/dashboard/, {
      timeout: 30000,
    });
    await expect(botPage.getByText(/Selamat/)).toBeVisible({ timeout: 15000 });
    await expect(
      botPage.getByRole('button', { name: 'Toggle Sidebar' }).first()
    ).toBeVisible();
  });
});
