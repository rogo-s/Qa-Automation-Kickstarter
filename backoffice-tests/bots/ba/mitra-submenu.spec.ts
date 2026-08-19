import { test, expect } from '@playwright/test';
import { BaMitraSubMenuPage } from '../../../shared/pages/BaMitraSubMenuPage';

/**
 * Sub-menu Mitra - BOT BA (Biller Aggregator).
 * READ/VIEW dengan data mitra QA yang SUDAH ADA (QAMITRA - QA MITRA TES EDIT).
 * Tidak ada aksi tulis (Top Up / Generate / Price TIDAK dieksekusi).
 *
 * 1. Top Up: halaman + identitas mitra + kolom tabel + tombol Topup tampil
 * 2. Riwayat: halaman + identitas mitra + kolom tabel + filter status
 * 3. Product Pricing: halaman + identitas + kolom + tombol Generate/Price tampil
 * 4. Credential: halaman + identitas + field Public Key/Auth URL/Callback URL
 * 5. Search Top Up: keyword acak -> "Tidak ada data"
 */
test.describe.configure({ mode: 'serial', timeout: 420000 });

test.describe('BOT BA - Sub-menu Mitra @regression', () => {
  test('1. Buka Top Up mitra QA: identitas, kolom & tombol Topup tampil @smoke', async ({ page }) => {
    const sub = await BaMitraSubMenuPage.open(page, 'Top Up');

    await expect(sub.heading('Top Up')).toBeVisible({ timeout: 15000 });
    await sub.expectMitraIdentity();
    await sub.expectTableHeader('Nilai Top Up', 'Tanggal Top Up', 'PIC Admin', 'Bank Penerima', 'No Rekening Pengirim', 'Nama Pengirim', 'Tanggal Transfer', 'Deskripsi');
    await expect(sub.page.getByRole('button', { name: 'Topup' }).first()).toBeVisible({ timeout: 15000 });
  });

  test('2. Buka Riwayat mitra QA: identitas & kolom tabel tampil @smoke', async ({ page }) => {
    const sub = await BaMitraSubMenuPage.open(page, 'Riwayat');

    await expect(sub.heading('Riwayat')).toBeVisible({ timeout: 15000 });
    await sub.expectMitraIdentity();
    await sub.expectTableHeader('Total', 'Debit Credit', 'Deskripsi', 'Id Transaksi', 'Referensi Transaksi', 'Waktu Transaksi', 'Tipe');
    await expect(sub.page.locator('main button', { hasText: 'Pilih Status' }).first()).toBeVisible({ timeout: 15000 });
  });

  test('3. Buka Product Pricing mitra QA: identitas, kolom & tombol Generate/Price tampil @smoke', async ({ page }) => {
    const sub = await BaMitraSubMenuPage.open(page, 'Product Pricing');

    await expect(sub.heading('Product Pricing')).toBeVisible({ timeout: 15000 });
    await sub.expectMitraIdentity();
    await sub.expectTableHeader('Produk', 'Kategori', 'Grup', 'Harga', 'Biaya Admin', 'Komisi', 'Status');
    await expect(sub.page.getByRole('button', { name: 'Generate' }).first()).toBeVisible({ timeout: 15000 });
    await expect(sub.page.getByRole('button', { name: 'Price' }).first()).toBeVisible({ timeout: 15000 });
  });

  test('4. Buka Credential mitra QA: identitas & field credential tampil @smoke', async ({ page }) => {
    const sub = await BaMitraSubMenuPage.open(page, 'Credential');

    await expect(sub.heading('Credentials Mitra')).toBeVisible({ timeout: 15000 });
    await sub.expectMitraIdentity();
    await expect(sub.page.getByText('Public Key').first()).toBeVisible({ timeout: 15000 });
    await expect(sub.page.getByText('Auth URL').first()).toBeVisible();
    await expect(sub.page.getByText('Callback URL').first()).toBeVisible();
  });

  test('5. Search Top Up mitra QA: keyword acak -> "Tidak ada data" @smoke', async ({ page }) => {
    const sub = await BaMitraSubMenuPage.open(page, 'Top Up');

    await sub.search('zzzznothing');
    await expect(sub.page.locator('main tbody').first()).toContainText('Tidak ada data');
  });

  test('6. EKSEKUSI Top Up mitra QA: validasi form lalu topup Rp 50.000 masuk tabel @smoke', async ({ page }) => {
    const sub = await BaMitraSubMenuPage.open(page, 'Top Up');
    await sub.openTopupForm();

    await expect(sub.isTopupDisabled()).resolves.toBeTruthy();

    const now = new Date();
    const dt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T10:30`;

    await sub.fillTopupForm({ jumlah: '50000' });
    await expect(sub.isTopupDisabled()).resolves.toBeTruthy();

    await sub.pickTopupBank('CIMB');
    await sub.pickTopupBank('CIMB');
    await sub.fillTopupForm({ norek: '1234567890', nama: 'QA PENGIRIM TES', tanggal: dt, deskripsi: 'Topup QA test' });
    await expect(sub.isTopupDisabled()).resolves.toBeFalsy();

    await sub.submitTopup();

    await expect(sub.page.locator('main tbody').first()).toContainText('QA PENGIRIM TES');
    await expect(sub.page.locator('main tbody').first()).toContainText('Rp 50.000');
  });

  test('8. Dialog Price (mitra DIGI01): terbuka, Simpan disabled sampai form terisi, lalu tutup @smoke', async ({ page }) => {
    const sub = await BaMitraSubMenuPage.open(page, 'Product Pricing', 'DIGI01');

    // Non-destruktif: hanya validasi dialog. Catatan BA-006: picker product
    // me-disable produk yang sudah punya pricing, jadi aksi Simpan tidak dieksekusi.
    await sub.clickAddPrice();

    await expect(sub.priceDialog()).toBeVisible({ timeout: 10000 });
    await expect(sub.isPriceDisabled()).resolves.toBeTruthy();

    await sub.closePrice();
    await expect(sub.priceDialog()).toHaveCount(0, { timeout: 10000 });
  });

  test('9. EKSEKUSI Generate Product Pricing (mitra DIGI01): tabel tetap termuat @smoke', async ({ page }) => {
    const sub = await BaMitraSubMenuPage.open(page, 'Product Pricing', 'DIGI01');

    await sub.clickGeneratePricing();

    await expect(sub.page.locator('main table thead').first()).toBeVisible({ timeout: 15000 });
  });
});
