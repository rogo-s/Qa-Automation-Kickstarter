import { test, expect } from '@playwright/test';
import { PpobNonaMenuBaruPage } from '../../../shared/pages/PpobNonaMenuBaruPage';

/**
 * Transactions - BOT PPOB NONA (webview via popup portal):
 * 1. Monitoring: search "Cari Customer Id" memfilter tabel
 * 2. Monitoring: buka dialog Filter lalu Terapkan -> tabel tampil (tidak kosong)
 * 3. Recapitulation: search "Cari Transaksi" -> tabel tampil
 * 4. Recapitulation: buka date picker "Pilih Tanggal" -> dialog tanggal muncul
 *
 * Catatan:
 *  - Halaman TIDAK bisa di-goto langsung (404); navigasi lewat klik link sidebar.
 *  - Tidak ada aksi tulis (hanya baca + filter). Data memakai nilai real yang ada.
 */
test.describe.configure({ mode: 'serial', timeout: 240000 });

test.describe('BOT PPOB NONA - Transactions @regression', () => {
  test('1. Monitoring: search customer id menampilkan data terfilter @smoke', async ({ page }) => {
    const m = await PpobNonaMenuBaruPage.open(page);
    await m.openViaSidebar('/transactions/monitoring', 'Monitoring Transaction');

    await m.searchMonitoring('322561241175');
    await expect(m.monitoringHeading()).toBeVisible();
    const rows = await m.tableRows();
    expect(rows).toBeGreaterThan(0);
    await expect(m.table()).toContainText('322561241175');
  });

  test('2. Monitoring: buka dialog filter lalu terapkan @smoke', async ({ page }) => {
    const m = await PpobNonaMenuBaruPage.open(page);
    await m.openViaSidebar('/transactions/monitoring', 'Monitoring Transaction');

    await m.openMonitoringFilter();
    await m.clickTerapkan();

    await expect(m.monitoringHeading()).toBeVisible();
    await expect(m.table()).toBeVisible();
  });

  test('3. Recap: search transaksi menampilkan data @smoke', async ({ page }) => {
    const m = await PpobNonaMenuBaruPage.open(page);
    await m.openViaSidebar('/transactions/recap', 'Rekap Transaksi');

    await m.searchRecap('14');
    await expect(m.recapHeading()).toBeVisible();
    const rows = await m.tableRows();
    expect(rows).toBeGreaterThan(0);
  });

  test('4. Recap: buka date picker pilih tanggal @smoke', async ({ page }) => {
    const m = await PpobNonaMenuBaruPage.open(page);
    await m.openViaSidebar('/transactions/recap', 'Rekap Transaksi');

    await m.openRecapDatePicker();
    await expect(m.page.getByRole('dialog')).toBeVisible();
  });
});
