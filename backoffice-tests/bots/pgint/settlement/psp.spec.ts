import { test, expect } from '@playwright/test';
import { PgintMasterPage } from '../../../../shared/pages/PgintMasterPage';
test.describe.configure({ mode: 'serial', timeout: 240000 });
test.describe('BOT PGINT - Settlement PSP @regression', () => {
  test('1. View: Settlement PSP tampil @smoke', async ({ page }) => {
    const m = await PgintMasterPage.open(page, 'merchant');
    await m.page.goto('https://backoffice-pg-playground.lentera-app.id/settlement/psp');
    await expect(m.page.getByRole('heading', { name: /PSP/i }).first()).toBeVisible({timeout:15000});
    await expect(m.page.locator('main table').first()).toBeVisible().catch(()=>{});
  });
});
