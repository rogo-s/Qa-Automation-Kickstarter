import { test, expect } from '@playwright/test';
import { PpobNonaMenuBaruPage } from '../../../../shared/pages/PpobNonaMenuBaruPage';

/**
 * Transaction Suspect - BOT PPOB NONA.
 *
 * Status: DEV BELUM SELESAI. Halaman `/trx-suspect/trx-suspect-data` &
 * `/trx-suspect/trx-suspect-refund` saat ini menampilkan "Halaman Tidak Ditemukan"
 * (404) — fitur belum di-route di aplikasi.
 *
 * Folder & spec ini DISIAPKAN sebagai tempat untuk test saat fitur rilis.
 * Semua test di-skip sampai endpoint aktif.
 */
test.describe.configure({ mode: 'serial', timeout: 60000 });

test.describe('BOT PPOB NONA - Transaction Suspect @regression', () => {
  test.skip('1. Data: halaman menampilkan daftar trx suspect (fitur belum rilis)', async ({ page }) => {
    const m = await PpobNonaMenuBaruPage.open(page);
    await m.openViaSidebar('/trx-suspect/trx-suspect-data', 'Transaction Suspect');
    await expect(m.table()).toBeVisible();
  });

  test.skip('2. Refund: halaman menampilkan daftar refund (fitur belum rilis)', async ({ page }) => {
    const m = await PpobNonaMenuBaruPage.open(page);
    await m.openViaSidebar('/trx-suspect/trx-suspect-refund', 'Transaction Suspect Refund');
    await expect(m.table()).toBeVisible();
  });
});