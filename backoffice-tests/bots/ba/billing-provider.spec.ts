import { test, expect } from '@playwright/test';
import { BaPage } from '../../../shared/pages/BaPage';

/**
 * Master Data Billing Provider - BOT BA (Biller Aggregator).
 * Fase 1: buka halaman, verifikasi tabel + filter Provider/Status.
 */
test.describe.configure({ mode: 'serial', timeout: 180000 });

test.describe('BOT BA - Menu Billing Provider @regression', () => {
  test('Buka halaman Billing Providers: tabel & filter tampil @smoke', async ({ page }) => {
    const ba = await BaPage.open(page);
    await ba.openBillingProviders();

    await ba.expectTableHeader('Nama', 'Kode', 'Route', 'Status');
    await expect(ba.page.getByRole('button', { name: 'Provider' }).first()).toBeVisible({ timeout: 15000 });
    await expect(ba.filterControl('Pilih Status').first()).toBeVisible();
    await expect(ba.page.locator('main input[placeholder*="Cari"]').first()).toBeVisible();
  });
});
