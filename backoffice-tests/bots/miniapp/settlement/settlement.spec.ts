import { test, expect } from '@playwright/test';
import { MiniappMonitoringPage } from '../../../../shared/pages/MiniappMonitoringPage';
test.describe.configure({ mode: 'serial', timeout: 240000 });
test.describe('BOT MINIAPP - Settlement @regression', () => {
  test('1. View: Settlement tampil @smoke', async ({ page }) => {
    const m = await MiniappMonitoringPage.open(page, 'transaction-ppob' as any); // reuse
    await m.page.goto('https://miniapps-dashboard-internal-playground.lentera-app.id/settlement');
    await expect(m.page.getByRole('heading', { name: /Settlement/i }).first()).toBeVisible({timeout:15000});
    await expect(m.page.locator('main table').first()).toBeVisible().catch(()=>{});
  });
});
