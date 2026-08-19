import { test, expect } from '@playwright/test';
import { BaProductPage } from '../../../shared/pages/BaProductPage';

/**
 * Master Data Manage Product - BOT BA (Biller Aggregator).
 * Pola CRUD sama dengan PPOB NONA: SEARCH/cek data dulu, baru eksekusi.
 *
 * 1. Validasi form: Simpan disabled sampai field wajib terisi
 * 2. Simpan tanpa Biaya Admin/Komisi (tipe BILLING) -> error "AdminFee,
 *    CommissionFee tidak boleh kosong"
 * 3. Cek data ada/tidak -> bersihkan -> Tambah produk -> verifikasi
 * 4. Cek data ada -> Edit nama -> verifikasi
 * 5. Cek data ada -> Nonaktifkan lalu aktifkan lagi -> verifikasi status
 * 6. Cek data ada -> Hapus (konfirmasi) -> verifikasi hilang
 * 7. Tambah dengan kode duplikat -> "Kode produk sudah digunakan"
 */
test.describe.configure({ mode: 'serial', timeout: 420000 });

const PROD_NAME = 'QA PRODUK TES';
const PROD_NAME_EDITED = PROD_NAME + ' EDIT';
const PROD_CODE = 'QAPROD';
const PROD_DESC = 'Produk buatan QA';

test.describe('BOT BA - Menu Manage Product @regression', () => {
  test('1. Validasi form tambah: Simpan disabled sampai field wajib terisi @smoke', async ({ page }) => {
    const prod = await BaProductPage.open(page);
    await prod.openAddForm();

    await expect(prod.isSaveDisabled()).resolves.toBeTruthy();

    await prod.fillForm({ name: PROD_NAME });
    await expect(prod.isSaveDisabled()).resolves.toBeTruthy();

    await prod.fillForm({ code: PROD_CODE });
    await expect(prod.isSaveDisabled()).resolves.toBeTruthy();

    await prod.selectTipe(0);
    await expect(prod.isSaveDisabled()).resolves.toBeTruthy();

    await prod.pickOption('Pilih kategori', 1);
    await expect(prod.isSaveDisabled()).resolves.toBeTruthy();

    await prod.pickOption('Pilih grup', 1);
    await expect(prod.isSaveDisabled()).resolves.toBeTruthy();

    await prod.pickOption('Pilih provider', 1);
    await expect(prod.isSaveDisabled()).resolves.toBeTruthy();

    await prod.fillForm({ description: PROD_DESC });
    await expect(prod.isSaveDisabled()).resolves.toBeFalsy();

    await prod.cancel();
  });

  test('2. Simpan tanpa Biaya Admin/Komisi: error "AdminFee, CommissionFee tidak boleh kosong" @smoke', async ({ page }) => {
    const prod = await BaProductPage.open(page);
    await prod.openAddForm();

    await prod.fillForm({ name: PROD_NAME, code: PROD_CODE, description: PROD_DESC });
    await prod.selectTipe(0);
    await prod.pickOption('Pilih kategori', 1);
    await prod.pickOption('Pilih grup', 1);
    await prod.pickOption('Pilih provider', 1);
    await prod.save();

    await expect(prod.page.getByText('AdminFee, CommissionFee tidak boleh kosong').first()).toBeVisible({ timeout: 10000 });
    await prod.cancel();
  });

  test('3. Cek data ada/tidak, lalu Tambah produk & verifikasi @smoke', async ({ page }) => {
    const prod = await BaProductPage.open(page);

    if (await prod.hasRow(PROD_CODE)) {
      await prod.deleteData(PROD_CODE);
      await expect(prod.hasRow(PROD_CODE)).resolves.toBeFalsy();
    }

    await prod.openAddForm();
    await prod.fillForm({ name: PROD_NAME, code: PROD_CODE, description: PROD_DESC });
    await prod.selectTipe(0);
    await prod.pickOption('Pilih kategori', 1);
    await prod.pickOption('Pilih grup', 1);
    await prod.pickOption('Pilih provider', 1);
    await prod.fillEnabledHarga('100');
    await prod.save();

    await prod.page.waitForURL(/\/manage_product_internal$/, { timeout: 15000 });
    await expect(prod.hasRow(PROD_CODE)).resolves.toBeTruthy();
    const row = prod.rowFor(PROD_CODE);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(PROD_NAME);
    await expect(row).toContainText('BILLING');
    await expect(row).toContainText('Aktif');
  });

  test('4. Cek data ada, lalu Edit nama & verifikasi @smoke', async ({ page }) => {
    const prod = await BaProductPage.open(page);

    expect(await prod.hasRow(PROD_CODE)).toBeTruthy();

    await prod.openEditForm(PROD_CODE);
    await prod.fillForm({ name: PROD_NAME_EDITED });
    await prod.save();

    await prod.page.waitForURL(/\/manage_product_internal$/, { timeout: 15000 });
    await expect(prod.hasRow(PROD_CODE)).resolves.toBeTruthy();
    await expect(prod.rowFor(PROD_CODE)).toContainText(PROD_NAME_EDITED);
  });

  test('5. Cek data ada, lalu nonaktifkan & aktifkan lagi @smoke', async ({ page }) => {
    const prod = await BaProductPage.open(page);

    expect(await prod.hasRow(PROD_CODE)).toBeTruthy();

    await prod.openEditForm(PROD_CODE);
    await prod.setStatus(false);
    await prod.save();
    await prod.page.waitForURL(/\/manage_product_internal$/, { timeout: 15000 });
    await expect(prod.hasRow(PROD_CODE)).resolves.toBeTruthy();
    await expect(prod.rowFor(PROD_CODE)).toContainText('Tidak Aktif');

    await prod.openEditForm(PROD_CODE);
    await prod.setStatus(true);
    await prod.save();
    await prod.page.waitForURL(/\/manage_product_internal$/, { timeout: 15000 });
    await expect(prod.hasRow(PROD_CODE)).resolves.toBeTruthy();
    await expect(prod.rowFor(PROD_CODE)).toContainText('Aktif');
  });

  test('6. Cek data ada, lalu Hapus dengan konfirmasi @smoke', async ({ page }) => {
    const prod = await BaProductPage.open(page);

    expect(await prod.hasRow(PROD_CODE)).toBeTruthy();

    await prod.deleteData(PROD_CODE);

    await expect(prod.hasRow(PROD_CODE)).resolves.toBeFalsy();
  });

  test('7. Tambah dengan kode duplikat: "Kode produk sudah digunakan" @smoke', async ({ page }) => {
    const prod = await BaProductPage.open(page);

    await prod.openAddForm();
    await prod.fillForm({ name: 'QA DUP PROD', code: 'TBPJKS-7', description: 'Duplikat' });
    await prod.selectTipe(0);
    await prod.pickOption('Pilih kategori', 1);
    await prod.pickOption('Pilih grup', 1);
    await prod.pickOption('Pilih provider', 1);
    await prod.fillEnabledHarga('100');
    await prod.save();

    await expect(prod.page.getByText('Kode produk sudah digunakan').first()).toBeVisible({ timeout: 10000 });
    await prod.cancel();
    await expect(prod.hasRow('QA DUP PROD')).resolves.toBeFalsy();
  });
});
