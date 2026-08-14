import { test, expect } from '@playwright/test';
import { PpobNonaWebviewPage } from '../../../../shared/pages/PpobNonaWebviewPage';

/**
 * Webview Transaksi BOT PPOB NONA - Riwayat Transaksi (/transaction-history):
 * 1. Cari ID Pelanggan yang punya data riwayat -> tabel menampilkan baris transaksi
 *    (ID pelanggan, nama pelanggan, jenis layanan, total transaksi).
 * 2. Cari ID Pelanggan tanpa data riwayat -> muncul "Tidak ada data transaksi".
 *
 * Data riil:
 *  - 410061241344: ada 1 transaksi (PREPAID, Rp 50.000,00)
 *  - 523061241325: tidak ada data
 *
 * API: GET /api/history/v1.0/transactions?search=<idpel>&page=1&size=5
 *
 * Catatan: tiap pencarian harus di halaman baru (reload) karena state form search
 * memakai nilai lama bila pengisian berikutnya pada halaman yang sama.
 */
test.describe.configure({ mode: 'serial', timeout: 60000 });

test.describe('PPOB NONA Webview - Riwayat Transaksi @regression', () => {
  test('1. Cari ID dengan data: tabel menampilkan baris transaksi prepaid Rp 50.000,00 @smoke', async ({ page }) => {
    const webview = new PpobNonaWebviewPage(page);

    await webview.openHistory('410061241344');
    await webview.searchHistory();

    const row = webview.historyRow();
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText('410061241344');
    await expect(row).toContainText('50JT');
    await expect(row).toContainText('PREPAID');
    await expect(row).toContainText('Rp 50.000,00');
  });

  test('2. Cari ID tanpa data: muncul pesan tidak ada data transaksi @smoke', async ({ page }) => {
    const webview = new PpobNonaWebviewPage(page);

    await webview.openHistory('523061241325');
    await webview.searchHistory();

    await expect(webview.historyEmpty()).toBeVisible({ timeout: 10000 });
  });
});