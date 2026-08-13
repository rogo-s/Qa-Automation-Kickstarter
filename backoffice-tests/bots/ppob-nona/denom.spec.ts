import { test, expect } from '@playwright/test';
import { PpobNonaDenomPage } from '../../../shared/pages/PpobNonaDenomPage';

/**
 * Menu Denom - BOT PPOB NONA (session dari auth.setup.ts, buka webview via popup):
 * 1. Validasi form tambah: Simpan disabled saat form kosong / denom bukan angka / produk belum dipilih
 * 2. Tambah denom (produk Prepaid Kompor Listrik, nominal unik, status aktif) lalu verifikasi via Filter
 * 3. Edit denom: ubah nominal, status tetap aktif
 * 4. Status denom: nonaktifkan lalu aktifkan lagi
 * 5. Hapus denom lalu verifikasi baris tidak ada
 */
test.describe.configure({ mode: 'serial', timeout: 240000 });

const PRODUCT = 'Prepaid Kompor Listrik';
const DENOM = '9' + String(Date.now()).slice(-7);
const EDITED = '8' + String(Date.now()).slice(-7);

test.describe('BOT PPOB NONA - Menu Denom @regression', () => {
  test('1. Validasi form tambah: Simpan disabled saat tidak valid @smoke', async ({ page }) => {
    const denom = await PpobNonaDenomPage.open(page);
    await denom.openAddDenomForm();

    // Form kosong -> Simpan disabled
    await expect(denom.isSaveDisabled()).resolves.toBeTruthy();

    // Denom bukan angka -> tetap disabled
    await denom.fillDenom('Rp12.500');
    await expect(denom.isSaveDisabled()).resolves.toBeTruthy();
    await denom.fillDenom('abc');
    await expect(denom.isSaveDisabled()).resolves.toBeTruthy();

    // Denom angka tapi produk belum dipilih -> disabled
    await denom.fillDenom('12500');
    await expect(denom.isSaveDisabled()).resolves.toBeTruthy();

    // Tutup dialog tanpa menyimpan
    await page.keyboard.press('Escape');
  });

  test('2. Tambah denom lalu verifikasi muncul di tabel @smoke', async ({ page }) => {
    const denom = await PpobNonaDenomPage.open(page);
    await denom.openAddDenomForm();

    await denom.fillDenom(DENOM);
    await denom.selectProduct(PRODUCT);
    await expect(denom.selectedProduct()).resolves.toBe(PRODUCT);
    await expect(denom.isSaveDisabled()).resolves.toBeFalsy();

    await denom.save();

    // Tidak ada search: gunakan Filter produk + status Aktif
    await denom.filterBy(PRODUCT);

    const row = await denom.findRow(DENOM);
    expect(row).not.toBeNull();
    await expect(row!).toBeVisible({ timeout: 15000 });
    await expect(row!).toContainText(denom.formatDenom(DENOM));
    await expect(row!).toContainText('Aktif');

    // Reset filter agar state kembali normal
    await denom.openFilter();
    await denom.resetFilter();
  });

  test('3. Edit denom: ubah nominal lalu verifikasi @smoke', async ({ page }) => {
    const denom = await PpobNonaDenomPage.open(page);

    await denom.openEditDenomForm(DENOM, PRODUCT);
    await denom.fillDenom(EDITED);
    await denom.save();

    await denom.filterBy(PRODUCT);

    const row = await denom.findRow(EDITED);
    expect(row).not.toBeNull();
    await expect(row!).toBeVisible({ timeout: 15000 });
    await expect(row!).toContainText(denom.formatDenom(EDITED));
    await expect(row!).toContainText('Aktif');
  });

  test('4. Denom: nonaktifkan lalu aktifkan lagi @smoke', async ({ page }) => {
    const denom = await PpobNonaDenomPage.open(page);

    // Nonaktifkan
    await denom.openEditDenomForm(EDITED, PRODUCT);
    await denom.setStatus(false);
    await denom.save();

    await denom.filterBy(PRODUCT, 'Tidak Aktif');
    const inactiveRow = await denom.findRow(EDITED);
    expect(inactiveRow).not.toBeNull();
    await expect(inactiveRow!).toContainText('Tidak Aktif');
    await denom.openFilter();
    await denom.resetFilter();

    // Aktifkan kembali (denom saat ini Tidak Aktif -> filter status yang sesuai)
    await denom.openEditDenomForm(EDITED, PRODUCT, 'Tidak Aktif');
    await denom.setStatus(true);
    await denom.save();

    await denom.filterBy(PRODUCT);
    const activeRow = await denom.findRow(EDITED);
    expect(activeRow).not.toBeNull();
    await expect(activeRow!).toContainText('Aktif');
  });

  test('5. Hapus denom lalu verifikasi tidak ada di tabel @smoke', async ({ page }) => {
    const denom = await PpobNonaDenomPage.open(page);

    await denom.deleteDenom(EDITED, PRODUCT);

    await denom.filterBy(PRODUCT);

    const row = await denom.findRow(EDITED);
    expect(row).toBeNull();
  });
});
