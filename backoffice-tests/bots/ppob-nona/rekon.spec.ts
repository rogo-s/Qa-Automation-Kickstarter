import { test, expect } from '@playwright/test';
import { PpobNonaMenuBaruPage } from '../../../shared/pages/PpobNonaMenuBaruPage';

/**
 * Rekonsiliasi - BOT PPOB NONA (webview via popup portal):
 * 1. Data Gateway: buka filter dialog lalu terapkan -> tabel tampil
 * 2-5. Rekon BSI/BRI/BTN/Mandiri VA: tabel menampilkan data rekon (draft) + chips status
 * 6. Rekon (BSI): buka date picker "Pilih Tanggal Transaksi" -> dialog muncul
 *
 * Catatan:
 *  - Halaman TIDAK bisa di-goto langsung (404); navigasi lewat klik link sidebar.
 *  - Tanpa aksi tulis. Data rekon datang dari integrator; kita hanya tampil info.
 *  - Chips Draft/Processing/Finalized/Cancelled menampilkan jumlah; tabel difilter status.
 */
test.describe.configure({ mode: 'serial', timeout: 300000 });

const REKON_PAGES: Array<{ route: string; heading: string; label: string }> = [
  { route: '/reconciliation/rekon-bsi', heading: 'Rekonsiliasi BSI', label: 'BSI' },
  { route: '/reconciliation/rekon-bri', heading: 'Rekonsiliasi BRI', label: 'BRI' },
  { route: '/reconciliation/rekon-btn', heading: 'Rekonsiliasi BTN', label: 'BTN' },
  { route: '/reconciliation/mandiri-va', heading: 'Rekonsiliasi Mandiri VA', label: 'Mandiri VA' },
];

test.describe('BOT PPOB NONA - Rekonsiliasi @regression', () => {
  test('1. Data Gateway: buka filter dialog lalu terapkan @smoke', async ({ page }) => {
    const m = await PpobNonaMenuBaruPage.open(page);
    await m.openViaSidebar('/reconciliation/data-gateway', 'Data Gateway');

    await m.openDataGatewayFilter();
    await m.clickTerapkan();

    await expect(m.dataGatewayHeading()).toBeVisible();
    await expect(m.table()).toBeVisible();
  });

  for (const { route, heading, label } of REKON_PAGES) {
    test(`2. Rekon ${label}: tabel menampilkan data + chips status @smoke`, async ({ page }) => {
      const m = await PpobNonaMenuBaruPage.open(page);
      await m.openViaSidebar(route, heading);

      await expect(m.rekonHeading(label)).toBeVisible();
      await expect(m.table()).toBeVisible();
      const rows = await m.tableRows();
      expect(rows).toBeGreaterThan(0);
      await expect(m.chip('Draft')).toBeVisible();
      await expect(m.chip('Finalized')).toBeVisible();
    });
  }

  test('6. Rekon BSI: buka date picker tanggal transaksi @smoke', async ({ page }) => {
    const m = await PpobNonaMenuBaruPage.open(page);
    await m.openViaSidebar('/reconciliation/rekon-bsi', 'Rekonsiliasi BSI');

    await m.openRekonDatePicker();
    await expect(m.page.getByRole('dialog')).toBeVisible();
  });
});
