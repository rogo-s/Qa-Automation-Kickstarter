import { test, expect } from '@playwright/test';
import { PgintMasterPage } from '../../../../shared/pages/PgintMasterPage';
test.describe.configure({ mode: 'serial', timeout: 240000 });
test.describe('BOT PGINT - Rekap Transaksi @regression', () => {
  test('1. View: Rekap Transaksi tampil @smoke', async ({ page }) => {
    const m = await PgintMasterPage.open(page, 'merchant');
    await m.page.goto('https://backoffice-pg-playground.lentera-app.id/transaction/rekap-transaksi');
    await expect(m.page.getByRole('heading', { name: /Rekap Transaksi/i }).first()).toBeVisible({timeout:15000});
    await expect(m.page.locator('main table').first()).toBeVisible();
  });
});
