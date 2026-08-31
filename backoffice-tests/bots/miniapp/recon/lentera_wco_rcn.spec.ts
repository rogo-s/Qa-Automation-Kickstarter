import { test, expect } from '@playwright/test';
import { MiniappMasterPage } from '../../../../shared/pages/MiniappMasterPage';
test.describe.configure({ mode: 'serial', timeout: 240000 });
test.describe('BOT MINIAPP - Lentera Web Checkout @regression', () => {
  test('1. View: Lentera Web Checkout tampil @smoke', async ({ page }) => {
    const m = await MiniappMasterPage.open(page, 'user');
    await m.page.goto('https://miniapps-dashboard-internal-playground.lentera-app.id/recon/lentera_wco_rcn');
    await expect(m.page.getByRole('heading', { name: /Lentera/i }).first()).toBeVisible({timeout:15000});
  });
});
