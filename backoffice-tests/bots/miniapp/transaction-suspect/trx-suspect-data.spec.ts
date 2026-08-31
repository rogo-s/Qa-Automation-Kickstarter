import { test, expect } from '@playwright/test';
import { MiniappMonitoringPage } from '../../../../shared/pages/MiniappMonitoringPage';
test.describe.configure({ mode: 'serial', timeout: 240000 });
test.describe('BOT MINIAPP - Transaction Suspect trx-suspect-data @regression', () => {
  test('1. View: trx-suspect-data tampil @smoke', async ({ page }) => {
    const m = await MiniappMonitoringPage.open(page, 'transaction-ppob' as any);
    await m.page.goto('https://miniapps-dashboard-internal-playground.lentera-app.id/trx-suspect/trx-suspect-data');
    await expect(m.page.getByRole('heading', { name: /Transaction Suspect/i }).first()).toBeVisible({timeout:15000}).catch(async ()=>{ await expect(m.page.locator('main table').first()).toBeVisible(); });
  });
});
