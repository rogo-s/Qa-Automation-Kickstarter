import { test, expect } from '@playwright/test';
import { MiniappMasterPage } from '../../../../shared/pages/MiniappMasterPage';
test.describe.configure({ mode: 'serial', timeout: 240000 });
test.describe('BOT MINIAPP - QRIS Winpay @regression', () => {
  test('1. View: QRIS Winpay tampil @smoke', async ({ page }) => {
    const m = await MiniappMasterPage.open(page, 'user');
    await m.page.goto('https://miniapps-dashboard-internal-playground.lentera-app.id/recon/payment_gateway_winpay');
    await expect(m.page.getByRole('heading', { name: /QRIS/i }).first()).toBeVisible({timeout:15000});
  });
});
