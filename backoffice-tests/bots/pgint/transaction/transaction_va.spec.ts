import { test, expect } from '@playwright/test';
import { PgintMasterPage } from '../../../../shared/pages/PgintMasterPage';
test.describe.configure({ mode: 'serial', timeout: 240000 });
test.describe('BOT PGINT - Transaksi VA @regression', () => {
  test('1. View: Transaksi VA tampil @smoke', async ({ page }) => {
    const m = await PgintMasterPage.open(page, 'merchant');
    await m.page.goto('https://backoffice-pg-playground.lentera-app.id/transaction/information/transaction_va');
    await expect(m.page.getByRole('heading', { name: /VA/i }).first()).toBeVisible({timeout:15000});
    await expect(m.page.locator('main table').first()).toBeVisible();
  });
  test('2. Search: Cari @smoke', async ({ page }) => {
    const m = await PgintMasterPage.open(page, 'merchant');
    await m.page.goto('https://backoffice-pg-playground.lentera-app.id/transaction/information/transaction_va');
    const input = m.page.locator('main input[placeholder*="Cari"]');
    if (await input.count()>0) {
      await input.first().fill('BILL');
      await m.page.waitForTimeout(1000);
      console.log('[INFO] search BILL rows', await m.page.locator('main tbody tr').count());
    }
  });
});
