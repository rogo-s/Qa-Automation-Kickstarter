import { test, expect } from '@playwright/test';
import { PpobNonaProductPage } from '../../../shared/pages/PpobNonaProductPage';

/**
 * Master Data Produk - BOT PPOB NONA (session auth.setup.ts, webview via popup):
 * 1. Validasi form: Simpan disabled saat field kosong / sebagian, enabled saat kode+nama
 *    (deskripsi opsional)
 * 2. Tambah produk (kode, nama, deskripsi) lalu verifikasi via search
 * 3. Edit produk (ganti nama & deskripsi) lalu verifikasi
 * 4. Status produk: nonaktifkan lalu aktifkan lagi
 * 5. Hapus data uji di test TERAKHIR (cleanup, tidak meninggalkan data)
 */
test.describe.configure({ mode: 'serial', timeout: 240000 });

const UNIQ = Date.now().toString().slice(-6);
const PROD_NAME = 'QA PRODUCT ' + UNIQ;
const PROD_CODE = 'QAPROD' + UNIQ;
const EDITED_NAME = PROD_NAME + 'X';

test.describe('BOT PPOB NONA - Menu Produk @regression', () => {
  test('1. Validasi form tambah: Simpan disabled saat tidak lengkap @smoke', async ({ page }) => {
    const product = await PpobNonaProductPage.open(page);
    await product.openAddProductForm();

    await expect(product.isSaveDisabled()).resolves.toBeTruthy();

    await product.fillForm({ code: 'PRODX' });
    await expect(product.isSaveDisabled()).resolves.toBeTruthy();

    await product.fillForm({ code: 'PRODX', name: 'Produk Tes' });
    await expect(product.isSaveDisabled()).resolves.toBeFalsy();
  });

  test('2. Tambah produk lalu verifikasi muncul di tabel @smoke', async ({ page }) => {
    const product = await PpobNonaProductPage.open(page);
    await product.openAddProductForm();
    await product.fillForm({
      code: PROD_CODE,
      name: PROD_NAME,
      description: 'Produk uji QA',
    });
    await product.save();

    await expect(product.hasRow(UNIQ)).resolves.toBeTruthy();
    const row = product.rowFor(PROD_NAME);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(PROD_CODE);
    await expect(row).toContainText('Produk uji QA');
    await expect(row).toContainText('Aktif');
  });

  test('3. Edit produk: ubah nama & deskripsi lalu verifikasi @smoke', async ({ page }) => {
    const product = await PpobNonaProductPage.open(page);

    await product.openEditProductForm(PROD_NAME);
    await product.fillForm({ name: EDITED_NAME, description: 'Deskripsi diubah' });
    await product.save();

    await expect(product.hasRow(UNIQ)).resolves.toBeTruthy();
    const row = product.rowFor(EDITED_NAME);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(PROD_CODE);
    await expect(row).toContainText('Deskripsi diubah');
  });

  test('4. Produk: nonaktifkan lalu aktifkan lagi @smoke', async ({ page }) => {
    const product = await PpobNonaProductPage.open(page);

    await product.openEditProductForm(EDITED_NAME);
    await product.setStatus(false);
    await product.save();

    await expect(product.hasRow(UNIQ)).resolves.toBeTruthy();
    await expect(product.rowFor(EDITED_NAME)).toContainText('Nonaktif');

    await product.openEditProductForm(EDITED_NAME);
    await product.setStatus(true);
    await product.save();

    await expect(product.hasRow(UNIQ)).resolves.toBeTruthy();
    await expect(product.rowFor(EDITED_NAME)).toContainText('Aktif');
  });

  test('5. Hapus data uji (cleanup) lalu verifikasi tidak ada di tabel @smoke', async ({ page }) => {
    const product = await PpobNonaProductPage.open(page);

    await product.deleteProduct(EDITED_NAME);
  });
});