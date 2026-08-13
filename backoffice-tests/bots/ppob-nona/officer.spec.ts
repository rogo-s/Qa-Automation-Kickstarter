import { test, expect } from '@playwright/test';
import { PpobNonaOfficerPage } from '../../../shared/pages/PpobNonaOfficerPage';

/**
 * Master Data Officer - BOT PPOB NONA (session auth.setup.ts, webview via popup):
 * 1. Validasi form: Simpan disabled saat field kosong / sebagian, enabled saat lengkap
 * 2. Tambah officer lalu verifikasi via search
 * 3. Edit officer (ganti Nama) lalu verifikasi
 * 4. Status officer: nonaktifkan lalu aktifkan lagi (via Filter Status)
 * 5. Hapus officer lalu verifikasi tidak ada di tabel
 */
test.describe.configure({ mode: 'serial', timeout: 240000 });

const OFFICER_NAME = 'QA OFF ' + Date.now().toString().slice(-6);
const OFFICER_EMAIL = 'qaoff' + Date.now().toString().slice(-6) + '@yopmail.com';
const EDITED_NAME = OFFICER_NAME + 'X';

test.describe('BOT PPOB NONA - Menu Officer @regression', () => {
  test('1. Validasi form tambah: Simpan disabled saat tidak lengkap @smoke', async ({ page }) => {
    const officer = await PpobNonaOfficerPage.open(page);
    await officer.openAddOfficerForm();

    await expect(officer.isSaveDisabled()).resolves.toBeTruthy();

    await officer.fillForm({ name: 'Officer Tes' });
    await expect(officer.isSaveDisabled()).resolves.toBeTruthy();

    await officer.fillForm({ name: 'Officer Tes', email: 'officertes@yopmail.com' });
    await expect(officer.isSaveDisabled()).resolves.toBeTruthy();

    await officer.fillForm({ name: 'Officer Tes', email: 'officertes@yopmail.com', password: 'Rahasia123' });
    await expect(officer.isSaveDisabled()).resolves.toBeFalsy();
  });

  test('2. Tambah officer lalu verifikasi muncul di tabel @smoke', async ({ page }) => {
    const officer = await PpobNonaOfficerPage.open(page);
    await officer.openAddOfficerForm();
    await officer.fillForm({
      name: OFFICER_NAME,
      email: OFFICER_EMAIL,
      password: 'Rahasia123',
    });
    await officer.save();

    await expect(officer.hasRow(OFFICER_NAME)).resolves.toBeTruthy();
    const row = officer.rowFor(OFFICER_NAME);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(OFFICER_EMAIL);
    await expect(row).toContainText('Aktif');
  });

  test('3. Edit officer: ubah nama lalu verifikasi @smoke', async ({ page }) => {
    const officer = await PpobNonaOfficerPage.open(page);

    await officer.openEditOfficerForm(OFFICER_NAME);
    await officer.fillForm({ name: EDITED_NAME });
    await officer.save();

    await expect(officer.hasRow(EDITED_NAME)).resolves.toBeTruthy();
    const row = officer.rowFor(EDITED_NAME);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(OFFICER_EMAIL);
  });

  test('4. Officer: nonaktifkan lalu aktifkan lagi @smoke', async ({ page }) => {
    const officer = await PpobNonaOfficerPage.open(page);

    // Nonaktifkan
    await officer.openEditOfficerForm(EDITED_NAME);
    await officer.setStatus(false);
    await officer.save();

    await officer.filterByStatus('Tidak Aktif');
    await officer.search(EDITED_NAME);
    const inactiveRow = officer.rowFor(EDITED_NAME);
    await expect(inactiveRow).toBeVisible({ timeout: 10000 });
    await expect(inactiveRow).toContainText('Tidak Aktif');

    // Aktifkan kembali (saat ini Tidak Aktif -> filter status yang sesuai)
    await officer.openEditOfficerForm(EDITED_NAME);
    await officer.setStatus(true);
    await officer.save();

    await officer.filterByStatus('Aktif');
    await officer.search(EDITED_NAME);
    const activeRow = officer.rowFor(EDITED_NAME);
    await expect(activeRow).toBeVisible({ timeout: 10000 });
    await expect(activeRow).toContainText('Aktif');
  });

  test('5. Hapus officer lalu verifikasi tidak ada di tabel @smoke', async ({ page }) => {
    const officer = await PpobNonaOfficerPage.open(page);

    await officer.deleteOfficer(EDITED_NAME);

    await expect(officer.hasRow(EDITED_NAME)).resolves.toBeFalsy();
  });
});