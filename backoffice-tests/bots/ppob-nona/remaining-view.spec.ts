import { test, expect } from '@playwright/test';
import { PpobNonaMenuBaruPage } from '../../../shared/pages/PpobNonaMenuBaruPage';

/**
 * Sisa menu PPOB NONA — view only (cek bisa masuk halaman, heading & tabel tampil):
 * 1. WINPAY VA (Rekonsiliasi baru, belum di rekon.spec.ts)
 * 2. Force Payment (Transaction Suspect baru)
 * 3. Data (Transaction Suspect live, dulu skip)
 *
 * Scope view saja sesuai arahan.
 */
test.describe.configure({ mode: 'serial', timeout: 240000 });

test.describe('BOT PPOB NONA - Sisa View @regression', () => {
  test('1. WINPAY VA: heading + tabel + chips + Upload File + date picker @smoke', async ({ page }) => {
    const m = await PpobNonaMenuBaruPage.open(page);
    await m.openViaSidebar('/reconciliation/winpay-va', 'Rekonsiliasi Winpay VA');

    await expect(m.rekonHeading('Winpay VA')).toBeVisible();
    await expect(m.page.getByRole('button', { name: 'Upload File' })).toBeVisible();
    await expect(m.table()).toBeVisible();
    await expect(m.chip('Draft')).toBeVisible();
    await expect(m.page.getByRole('button', { name: 'Pilih Tanggal Transaksi' })).toBeVisible();

    // buka date picker coba
    await m.openRekonDatePicker();
    await expect(m.page.getByRole('dialog')).toBeVisible();
    await m.page.keyboard.press('Escape');
  });

  test('2. Force Payment: heading + tabel + tabs Semua/Menunggu/Disetujui @smoke', async ({
    page,
  }) => {
    const m = await PpobNonaMenuBaruPage.open(page);
    await m.openViaSidebar(
      '/trx-suspect/trx-suspect-force-payment',
      'Transaksi Suspect Force Payment',
    );

    await expect(m.heading('Transaksi Suspect Force Payment')).toBeVisible();
    await expect(m.table()).toBeVisible();
    await expect(m.page.getByRole('button', { name: 'Semua' }).first()).toBeVisible();
    await expect(m.page.getByRole('button', { name: 'Menunggu Persetujuan' })).toBeVisible();
    await expect(m.page.getByRole('button', { name: 'Disetujui' })).toBeVisible();
  });

  test('3. Data: heading + tabel Transaction Suspect Data @smoke', async ({ page }) => {
    const m = await PpobNonaMenuBaruPage.open(page);
    await m.openViaSidebar('/trx-suspect/trx-suspect-data', 'Transaksi Suspect Data');

    await expect(m.heading('Transaksi Suspect Data')).toBeVisible();
    await expect(m.table()).toBeVisible();
  });
});
