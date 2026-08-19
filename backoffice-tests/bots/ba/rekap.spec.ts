import { test, expect } from '@playwright/test';
import { BaPage } from '../../../shared/pages/BaPage';

/**
 * Transaksi Rekap - BOT BA (Biller Aggregator).
 * Fase 1: buka halaman Rekap Transaksi, verifikasi tabel + Export + filter tanggal.
 */
test.describe.configure({ mode: 'serial', timeout: 180000 });

test.describe('BOT BA - Menu Rekap Transaksi @regression', () => {
  test('Buka halaman Rekap Transaksi: tabel, Export & filter tanggal tampil @smoke', async ({ page }) => {
    const ba = await BaPage.open(page);
    await ba.openRekap();

    await ba.expectTableHeader('Tanggal Transaksi', 'Total Transaksi', 'Total Jumlah (Rp)', 'Total Tagihan Billing (Rp)', 'Total Pendapatan (Rp)');
    await expect(ba.page.getByRole('button', { name: 'Export' }).first()).toBeVisible({ timeout: 15000 });
    await expect(ba.filterControl('Pilih Tanggal').first()).toBeVisible();
  });
});
