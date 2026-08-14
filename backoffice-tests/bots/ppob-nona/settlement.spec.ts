import { test, expect } from '@playwright/test';
import { PpobNonaMenuBaruPage } from '../../../shared/pages/PpobNonaMenuBaruPage';

/**
 * Settlement - BOT PPOB NONA (webview via popup portal):
 * 1. Payment Service Provider: tabel menampilkan data settlement
 * 2. Payment Service Provider: buka halaman Tambah (create) -> form step 1 terlihat -> Batal
 * 3. Biller: tabel menampilkan data settlement
 * 4. Biller: buka halaman Tambah (create) -> form terlihat -> Batal
 *
 * Catatan:
 *  - Halaman TIDAK bisa di-goto langsung (404); navigasi lewat klik link sidebar.
 *  - Hanya tampil data + buka dialog Tambah TANPA mengisi data (sesuai arahan).
 *  - Tombol "Tambah" meng-route ke halaman baru `.../create` (bukan dialog modal).
 */
test.describe.configure({ mode: 'serial', timeout: 240000 });

test.describe('BOT PPOB NONA - Settlement @regression', () => {
  test('1. PSP: tabel menampilkan data settlement @smoke', async ({ page }) => {
    const m = await PpobNonaMenuBaruPage.open(page);
    await m.openViaSidebar('/settlement/payment-service-provider', 'Settlement Payment Service Provider');

    await expect(m.settlementHeading('Payment Service Provider')).toBeVisible();
    await expect(m.table()).toBeVisible();
    const rows = await m.tableRows();
    expect(rows).toBeGreaterThan(0);
  });

  test('2. PSP: buka halaman tambah lalu batal @smoke', async ({ page }) => {
    const m = await PpobNonaMenuBaruPage.open(page);
    await m.openViaSidebar('/settlement/payment-service-provider', 'Settlement Payment Service Provider');

    await m.openSettlementCreate();
    await expect(m.heading('Buat Settlement PSP')).toBeVisible();
    await m.cancelCreate();
    await expect(m.page).toHaveURL(/\/settlement\/payment-service-provider$/);
  });

  test('3. Biller: tabel menampilkan data settlement @smoke', async ({ page }) => {
    const m = await PpobNonaMenuBaruPage.open(page);
    await m.openViaSidebar('/settlement/biller', 'Settlement Biller');

    await expect(m.settlementHeading('Biller')).toBeVisible();
    await expect(m.table()).toBeVisible();
    const rows = await m.tableRows();
    expect(rows).toBeGreaterThan(0);
  });

  test('4. Biller: buka halaman tambah lalu batal @smoke', async ({ page }) => {
    const m = await PpobNonaMenuBaruPage.open(page);
    await m.openViaSidebar('/settlement/biller', 'Settlement Biller');

    await m.openSettlementCreate();
    await expect(m.heading('Buat Settlement Biller')).toBeVisible();
    await m.cancelCreate();
    await expect(m.page).toHaveURL(/\/settlement\/biller$/);
  });
});