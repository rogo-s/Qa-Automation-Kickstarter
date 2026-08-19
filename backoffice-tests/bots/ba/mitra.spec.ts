import { test, expect } from '@playwright/test';
import { BaMitraPage } from '../../../shared/pages/BaMitraPage';

/**
 * Master Data Mitra - BOT BA (Biller Aggregator).
 * Pola CRUD sama dengan PPOB NONA: SEARCH/cek data dulu, baru eksekusi.
 *
 * CATATAN (finding BA-004): Mitra TIDAK punya fitur hapus, hanya
 * Aktifkan/Nonaktifkan. Maka "delete" digantikan toggle status & duplikat.
 *
 * 1. Validasi form: Simpan disabled sampai semua field + tipe pembayaran terisi
 * 2. Cek data ada/tidak -> Tambah mitra (bila belum ada) -> verifikasi
 * 3. Cek data ada -> Detail/Ubah -> Edit nama -> verifikasi
 * 4. Cek data ada -> Aktifkan lalu Nonaktifkan (toggle status) -> verifikasi
 * 5. Tambah dengan kode duplikat -> pesan "sudah digunakan" -> data tidak bertambah
 */
test.describe.configure({ mode: 'serial', timeout: 360000 });

const MITRA_CODE = 'QAMITRA';
const MITRA_NAME = 'QA MITRA TES';
const MITRA_NAME_EDITED = 'QA MITRA TES EDIT';
const MITRA_EMAIL = 'qa.mitra@yopmail.com';
const MITRA_PHONE = '081234567890';
const MITRA_ALAMAT = 'Jl QA No 1';
const PIC_NAME = 'PIC QA';
const PIC_EMAIL = 'pic.qa@yopmail.com';
const PIC_PHONE = '089876543210';

test.describe('BOT BA - Menu Mitra @regression', () => {
  test('1. Validasi form tambah: Simpan disabled sampai field wajib terisi @smoke', async ({ page }) => {
    const mitra = await BaMitraPage.open(page);
    await mitra.openAddForm();

    await expect(mitra.isSaveDisabled()).resolves.toBeTruthy();

    await mitra.fillDataMitra({ code: MITRA_CODE, name: MITRA_NAME, email: MITRA_EMAIL, phone: MITRA_PHONE, alamat: MITRA_ALAMAT });
    await expect(mitra.isSaveDisabled()).resolves.toBeTruthy();

    await mitra.fillPic({ picName: PIC_NAME, picEmail: PIC_EMAIL, picPhone: PIC_PHONE });
    await expect(mitra.isSaveDisabled()).resolves.toBeTruthy();

    await mitra.selectTipePembayaran(1);
    await expect(mitra.isSaveDisabled()).resolves.toBeFalsy();

    await mitra.cancel();
  });

  test('2. Cek data ada/tidak, lalu Tambah mitra & verifikasi @smoke', async ({ page }) => {
    const mitra = await BaMitraPage.open(page);

    // Mitra tidak bisa dihapus, jadi tambah hanya bila data belum ada.
    if (await mitra.hasRow(MITRA_CODE)) {
      const row = mitra.rowFor(MITRA_CODE);
      await expect(row).toBeVisible({ timeout: 10000 });
    } else {
      await mitra.openAddForm();
      await mitra.fillDataMitra({ code: MITRA_CODE, name: MITRA_NAME, email: MITRA_EMAIL, phone: MITRA_PHONE, alamat: MITRA_ALAMAT });
      await mitra.fillPic({ picName: PIC_NAME, picEmail: PIC_EMAIL, picPhone: PIC_PHONE });
      await mitra.selectTipePembayaran(1);
      await mitra.save();
    }

    await expect(mitra.hasRow(MITRA_CODE)).resolves.toBeTruthy();
    const row = mitra.rowFor(MITRA_CODE);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(MITRA_CODE);
    await expect(row).toContainText('BALANCE');
  });

  test('3. Cek data ada, lalu Detail/Ubah -> Edit nama & verifikasi @smoke', async ({ page }) => {
    const mitra = await BaMitraPage.open(page);

    expect(await mitra.hasRow(MITRA_CODE)).toBeTruthy();

    await mitra.openDetail(MITRA_CODE);
    await mitra.editName(MITRA_NAME_EDITED);

    await mitra.page.goto('https://biller-dashboard-internal-playground.lentera-app.id/mitra_internal');
    await mitra.page.waitForTimeout(2500);
    await expect(mitra.hasRow(MITRA_CODE)).resolves.toBeTruthy();
    await expect(mitra.rowFor(MITRA_CODE)).toContainText(MITRA_NAME_EDITED);
  });

  test('4. Cek data ada, lalu Aktifkan & Nonaktifkan mitra @smoke', async ({ page }) => {
    const mitra = await BaMitraPage.open(page);

    expect(await mitra.hasRow(MITRA_CODE)).toBeTruthy();

    // pastikan jadi Tidak Aktif dulu (default), lalu aktifkan -> verifikasi Aktif
    await expect(mitra.rowFor(MITRA_CODE)).toContainText(/Aktif|Tidak Aktif/);
    const currentText = ((await mitra.rowFor(MITRA_CODE).textContent()) ?? '');
    if (currentText.includes('Tidak Aktif')) {
      await mitra.toggleStatus(MITRA_CODE);
      await expect(mitra.rowFor(MITRA_CODE)).toContainText('Aktif');
    }

    // nonaktifkan lagi -> verifikasi Tidak Aktif
    await mitra.toggleStatus(MITRA_CODE);
    await expect(mitra.rowFor(MITRA_CODE)).toContainText('Tidak Aktif');

    // aktifkan kembali agar status normal
    await mitra.toggleStatus(MITRA_CODE);
    await expect(mitra.rowFor(MITRA_CODE)).toContainText('Aktif');
  });

  test('5. Tambah dengan kode duplikat: pesan "sudah digunakan" & data tidak bertambah @smoke', async ({ page }) => {
    const mitra = await BaMitraPage.open(page);

    await mitra.openAddForm();
    await mitra.fillDataMitra({ code: 'AMS002', name: 'QA DUP MITRA', email: 'dup@yopmail.com', phone: '081111111111', alamat: 'Jl Dup' });
    await mitra.fillPic({ picName: 'PIC Dup', picEmail: 'picdup@yopmail.com', picPhone: '082222222222' });
    await mitra.selectTipePembayaran(1);
    await mitra.save();

    await expect(mitra.page.getByText(/sudah digunakan/).first()).toBeVisible({ timeout: 10000 });
    await mitra.cancel();
    await expect(mitra.hasRow('QA DUP MITRA')).resolves.toBeFalsy();
  });
});
