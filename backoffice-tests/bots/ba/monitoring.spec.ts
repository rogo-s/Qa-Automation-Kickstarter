import { test, expect } from '@playwright/test';
import { BaPage } from '../../../shared/pages/BaPage';

/**
 * Transaksi Monitoring - BOT BA (Biller Aggregator).
 * Fase 1: buka halaman Informasi Transaksi, verifikasi tabel + Export + filter.
 */
test.describe.configure({ mode: 'serial', timeout: 180000 });

test.describe('BOT BA - Menu Monitoring Transaksi @regression', () => {
  test('Buka halaman Monitoring: tabel, Export & filter tampil @smoke', async ({ page }) => {
    const ba = await BaPage.open(page);
    await ba.openMonitoring();

    await ba.expectTableHeader('Id Biller', 'Tanggal Transaksi', 'Biller', 'Mitra', 'Product', 'Type Product', 'Total', 'ID Transaksi', 'Status Transaksi');
    await expect(ba.page.getByRole('button', { name: 'Export' }).first()).toBeVisible({ timeout: 15000 });
    await expect(ba.filterControl('Pilih Tanggal Pembayaran').first()).toBeVisible();
    await expect(ba.filterControl('Pilih Status').first()).toBeVisible();
    await expect(ba.page.locator('main input[placeholder*="Cari"]').first()).toBeVisible();
  });
});
