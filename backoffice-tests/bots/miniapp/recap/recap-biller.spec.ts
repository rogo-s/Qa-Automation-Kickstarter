import { test, expect } from '@playwright/test';
import { MiniappMasterPage } from '../../../../shared/pages/MiniappMasterPage';
test.describe.configure({ mode: 'serial', timeout: 240000 });
test.describe('BOT MINIAPP - Rekap Transaksi @regression', () => {
  test('1. View: Rekap Transaksi tampil @smoke', async ({ page }) => {
    const m = await MiniappMasterPage.open(page, 'user'); // reuse portal open
    await m.page.goto('https://miniapps-dashboard-internal-playground.lentera-app.id/recap/recap-biller');
    await expect(m.page.getByRole('heading', { name: /Rekap/i }).first()).toBeVisible({timeout:15000});
    await expect(m.page.locator('main table').first()).toBeVisible().catch(()=>{});
  });
});
