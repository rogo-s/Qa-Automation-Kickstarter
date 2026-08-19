import { test, expect } from '@playwright/test';
import { BaUserPage } from '../../../shared/pages/BaUserPage';

/**
 * Master Data Manage User - BOT BA (Biller Aggregator).
 * Pola CRUD sama dengan PPOB NONA: SEARCH/cek data dulu, baru eksekusi.
 *
 * CATATAN: User TIDAK punya fitur hapus (hanya Ubah & Detail), jadi
 * "delete" digantikan validasi status + duplikat email.
 *
 * 1. Validasi form: Simpan disabled sampai field wajib + role terisi
 * 2. Cek data ada/tidak -> Tambah user internal -> verifikasi
 * 3. Cek data ada -> Ubah nama -> verifikasi
 * 4. Cek data ada -> Nonaktifkan lalu aktifkan lagi -> verifikasi status
 * 5. Cek data ada -> Detail -> halaman Detail User Internal tampil
 * 6. Tambah dengan email duplikat -> pesan "sudah digunakan"
 */
test.describe.configure({ mode: 'serial', timeout: 420000 });

const USER_NAME = 'QA USER TES';
const USER_NAME_EDITED = USER_NAME + ' EDIT';
const USER_EMAIL = 'qa.user@yopmail.com';
const USER_PHONE = '081234567890';
const USER_PASSWORD = 'Password@123';
const MITRA_EMAIL = 'qa.usermitra@yopmail.com';

test.describe('BOT BA - Menu Manage User @regression', () => {
  test('1. Validasi form tambah: Simpan disabled sampai field wajib terisi @smoke', async ({ page }) => {
    const user = await BaUserPage.open(page);
    await user.openAddForm();

    await expect(user.isSaveDisabled()).resolves.toBeTruthy();

    await user.fillForm({ fullName: USER_NAME });
    await expect(user.isSaveDisabled()).resolves.toBeTruthy();

    await user.fillForm({ email: USER_EMAIL });
    await expect(user.isSaveDisabled()).resolves.toBeTruthy();

    await user.fillForm({ phone: USER_PHONE });
    await expect(user.isSaveDisabled()).resolves.toBeTruthy();

    await user.fillForm({ password: USER_PASSWORD });
    await expect(user.isSaveDisabled()).resolves.toBeTruthy();

    await user.selectRole('DevOps');
    await expect(user.isSaveDisabled()).resolves.toBeFalsy();

    await user.cancel();
  });

  test('2. Cek data ada/tidak, lalu Tambah user & verifikasi @smoke', async ({ page }) => {
    const user = await BaUserPage.open(page);

    // User tidak bisa dihapus, jadi tambah hanya bila data belum ada.
    if (await user.hasRow(USER_EMAIL)) {
      const row = user.rowFor(USER_EMAIL);
      await expect(row).toBeVisible({ timeout: 10000 });
    } else {
      await user.openAddForm();
      await user.fillForm({ fullName: USER_NAME, email: USER_EMAIL, phone: USER_PHONE, password: USER_PASSWORD });
      await user.selectRole('DevOps');
      await user.save();
    }

    await expect(user.hasRow(USER_EMAIL)).resolves.toBeTruthy();
    const row = user.rowFor(USER_EMAIL);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(USER_EMAIL);
    await expect(row).toContainText('DevOps');
    await expect(row).toContainText('Aktif');
  });

  test('3. Cek data ada, lalu Ubah nama & verifikasi @smoke', async ({ page }) => {
    const user = await BaUserPage.open(page);

    expect(await user.hasRow(USER_EMAIL)).toBeTruthy();

    await user.openEditForm(USER_EMAIL);
    await user.fillForm({ fullName: USER_NAME_EDITED });
    await user.save();

    await user.page.waitForURL(/\/manage_user_internal/, { timeout: 15000 });
    await expect(user.hasRow(USER_EMAIL)).resolves.toBeTruthy();
    await expect(user.rowFor(USER_EMAIL)).toContainText(USER_NAME_EDITED);
  });

  test('4. Cek data ada, lalu nonaktifkan & aktifkan lagi @smoke', async ({ page }) => {
    const user = await BaUserPage.open(page);

    expect(await user.hasRow(USER_EMAIL)).toBeTruthy();

    await user.openEditForm(USER_EMAIL);
    await user.setStatus(false);
    await user.save();
    await user.page.waitForURL(/\/manage_user_internal/, { timeout: 15000 });
    await expect(user.hasRow(USER_EMAIL)).resolves.toBeTruthy();
    await expect(user.rowFor(USER_EMAIL)).toContainText('Tidak Aktif');

    await user.openEditForm(USER_EMAIL);
    await user.setStatus(true);
    await user.save();
    await user.page.waitForURL(/\/manage_user_internal/, { timeout: 15000 });
    await expect(user.hasRow(USER_EMAIL)).resolves.toBeTruthy();
    await expect(user.rowFor(USER_EMAIL)).toContainText('Aktif');
  });

  test('5. Cek data ada, lalu buka Detail User Internal @smoke', async ({ page }) => {
    const user = await BaUserPage.open(page);

    expect(await user.hasRow(USER_EMAIL)).toBeTruthy();

    await user.openDetail(USER_EMAIL);
    await expect(user.page.locator('body')).toContainText(USER_EMAIL);
  });

  test('6. Tambah dengan email duplikat: pesan "sudah digunakan" muncul @smoke', async ({ page }) => {
    const user = await BaUserPage.open(page);

    await user.openAddForm();
    await user.fillForm({ fullName: 'QA DUP USER', email: 'rogo@yopmail.com', phone: '081111111111', password: USER_PASSWORD });
    await user.selectRole('DevOps');
    await user.save();

    await expect(user.page.getByText(/sudah digunakan|sudah terdaftar/).first()).toBeVisible({ timeout: 10000 });
    await user.cancel();
    await expect(user.hasRow('QA DUP USER')).resolves.toBeFalsy();
  });

  test('7. Validasi form tambah User Mitra: Simpan disabled sampai field + role + mitra terisi @smoke', async ({ page }) => {
    const user = await BaUserPage.open(page);
    await user.openAddFormMitra();

    await expect(user.isSaveDisabled()).resolves.toBeTruthy();

    await user.fillForm({ fullName: 'QA USER MITRA TES', username: 'qausermitra' });
    await expect(user.isSaveDisabled()).resolves.toBeTruthy();

    await user.fillForm({ email: MITRA_EMAIL });
    await expect(user.isSaveDisabled()).resolves.toBeTruthy();

    await user.fillForm({ phone: '081298765432', password: USER_PASSWORD });
    await expect(user.isSaveDisabled()).resolves.toBeTruthy();

    await user.selectRole('Mitra');
    await expect(user.isSaveDisabled()).resolves.toBeFalsy();

    await user.selectMitra('DIGI01');
    await expect(user.isSaveDisabled()).resolves.toBeFalsy();

    await user.cancel();
  });

  test('8. Cek data tab Mitra, lalu Tambah user mitra & verifikasi @smoke', async ({ page }) => {
    const user = await BaUserPage.open(page);
    await user.openTab('Mitra');

    // User tidak bisa dihapus, jadi tambah hanya bila data belum ada.
    if (await user.hasRow(MITRA_EMAIL)) {
      const row = user.rowFor(MITRA_EMAIL);
      await expect(row).toBeVisible({ timeout: 10000 });
    } else {
      await user.openAddFormMitra();
      await user.fillForm({ fullName: 'QA USER MITRA TES', username: 'qausermitra', email: MITRA_EMAIL, phone: '081298765432', password: USER_PASSWORD });
      await user.selectRole('Mitra');
      await user.selectMitra('DIGI01');
      await user.save();
    }

    await expect(user.hasRow(MITRA_EMAIL)).resolves.toBeTruthy();
    const row = user.rowFor(MITRA_EMAIL);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(MITRA_EMAIL);
    await expect(row).toContainText('PT Indonesia Digital Inovasi');
    await expect(row).toContainText('Aktif');
  });

  test('9. Cek data tab Mitra, lalu Ubah nama & verifikasi @smoke', async ({ page }) => {
    const user = await BaUserPage.open(page);
    await user.openTab('Mitra');

    expect(await user.hasRow(MITRA_EMAIL)).toBeTruthy();

    await user.openEditFormMitra(MITRA_EMAIL);
    await user.fillForm({ fullName: 'QA USER MITRA EDIT' });
    await user.save();

    await user.page.waitForURL(/\/manage_user_internal/, { timeout: 15000 });
    await user.openTab('Mitra');
    await expect(user.hasRow(MITRA_EMAIL)).resolves.toBeTruthy();
    await expect(user.rowFor(MITRA_EMAIL)).toContainText('QA USER MITRA EDIT');
  });

  test('10. Tambah user mitra dengan email duplikat: pesan "sudah digunakan" muncul @smoke', async ({ page }) => {
    const user = await BaUserPage.open(page);

    await user.openAddFormMitra();
    await user.fillForm({ fullName: 'QA DUP MITRA', username: 'qadupmitra', email: 'agustus@yopmail.com', phone: '081111111111', password: USER_PASSWORD });
    await user.selectRole('Mitra');
    await user.selectMitra('DIGI01');
    await user.save();

    await expect(user.page.getByText(/sudah digunakan|sudah terdaftar/).first()).toBeVisible({ timeout: 10000 });
    await user.cancel();
    await user.openTab('Mitra');
    await expect(user.hasRow('QA DUP MITRA')).resolves.toBeFalsy();
  });
});
