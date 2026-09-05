import { test, expect } from '@playwright/test';
import { PgintMasterPage } from '../../../../shared/pages/PgintMasterPage';

test.describe.configure({ mode: 'serial', timeout: 240000 });
test.describe('BOT PGINT - Dashboard @regression', () => {
  test('1. View: Dashboard tampil @smoke', async ({ page }) => {
    const m = await PgintMasterPage.open(page, 'merchant'); // reuse open via PGINT popup
    await m.page.goto('https://backoffice-pg-playground.lentera-app.id/');
    await expect(m.page.getByText(/Selamat Datang/).first()).toBeVisible({timeout:15000});
    await expect(m.page.getByText(/Settlement PSP/).first()).toBeVisible({timeout:10000});
  });
});
