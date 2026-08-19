import { test, expect } from '@playwright/test';
import { BaPage } from '../../../shared/pages/BaPage';

/**
 * Invoice - BOT BA (Biller Aggregator).
 * Fase 1: buka halaman Invoice, verifikasi tabel + tombol Generate.
 */
test.describe.configure({ mode: 'serial', timeout: 180000 });

test.describe('BOT BA - Menu Invoice @regression', () => {
  test('Buka halaman Invoice: tabel & tombol Generate tampil @smoke', async ({ page }) => {
    const ba = await BaPage.open(page);
    await ba.openInvoice();

    await ba.expectTableHeader('No. Invoice', 'Nama Mitra', 'Periode', 'Total Transaksi', 'Total Tagihan', 'Status');
    await expect(ba.page.getByRole('button', { name: 'Generate' }).first()).toBeVisible({ timeout: 15000 });
    await expect(ba.page.locator('main input[placeholder*="Cari"]').first()).toBeVisible();
  });
});
