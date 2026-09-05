import { test, expect } from '@playwright/test';
import { PgintMasterPage } from '../../../../shared/pages/PgintMasterPage';
test.describe.configure({ mode: 'serial', timeout: 240000 });
test.describe('BOT PGINT - Account Binding @regression', () => {
  test('1. View: List Account Binding tampil @smoke', async ({ page }) => {
    const m = await PgintMasterPage.open(page, 'merchant');
    await m.page.goto('https://backoffice-pg-playground.lentera-app.id/account-binding');
    await expect(m.page.getByRole('heading', { name: /Account Binding/i }).first()).toBeVisible({timeout:15000});
    await expect(m.page.locator('main table').first()).toBeVisible();
  });
  test('2. Search: Cari Nomor Telepon @smoke', async ({ page }) => {
    const m = await PgintMasterPage.open(page, 'merchant');
    await m.page.goto('https://backoffice-pg-playground.lentera-app.id/account-binding');
    const input = m.page.locator('main input[placeholder*="Cari Nomor Telepon"]');
    await input.fill('0812');
    await m.page.waitForTimeout(1200);
    const cnt = await m.page.locator('main tbody tr').count();
    console.log('[INFO] search 0812 rows', cnt);
    await input.fill('ZZZ_NOT_EXIST_999');
    await m.page.waitForTimeout(800);
    const c0 = await m.page.locator('main tbody tr').count();
    if(c0===0) console.log('[INFO] search tidak ada → 0 rows');
    await input.fill('');
  });
});
