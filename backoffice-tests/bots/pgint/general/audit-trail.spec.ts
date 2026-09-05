import { test, expect } from '@playwright/test';
import { PgintMasterPage } from '../../../../shared/pages/PgintMasterPage';
test.describe.configure({ mode: 'serial', timeout: 240000 });
test.describe('BOT PGINT - Audit Trail @regression', () => {
  test('1. View: Audit Trail tampil @smoke', async ({ page }) => {
    const m = await PgintMasterPage.open(page, 'merchant');
    await m.page.goto('https://backoffice-pg-playground.lentera-app.id/audit-trail');
    await expect(m.page.getByRole('heading', { name: /Audit Trail/i }).first()).toBeVisible({timeout:15000});
    await expect(m.page.locator('main table').first()).toBeVisible();
  });
  test('2. Search: Cari email @smoke', async ({ page }) => {
    const m = await PgintMasterPage.open(page, 'merchant');
    await m.page.goto('https://backoffice-pg-playground.lentera-app.id/audit-trail');
    const input = m.page.locator('main input[placeholder*="Cari email"]');
    await input.fill('yopmail');
    await m.page.waitForTimeout(1000);
    const cnt = await m.page.locator('main tbody tr').count();
    console.log('[INFO] search yopmail rows', cnt);
  });
});
