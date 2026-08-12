import { test, expect } from '@playwright/test';
import { PpobNonaPage } from '../../../shared/pages/PpobNonaPage';

/**
 * Menu User - BOT PPOB NONA (session dari auth.setup.ts, buka webview via popup):
 * 1. Tambah user QA Nona Testing (role QA Nona Super Admin, status aktif)
 * 2. Edit user qa.nona@yopmail.com -> nama QA Nona Updated, no telp baru (email tidak bisa diedit)
 * 3. User qa.nona@yopmail.com: nonaktifkan lalu aktifkan lagi (via form Ubah, switch Status)
 */
test.describe.configure({ mode: 'serial', timeout: 240000 });

const ROLE = { code: 'QANONA', name: 'QA Nona Super Admin', description: 'Role QA dibuat oleh automation test BOT PPOB NONA' };
const USER = {
  fullName: 'QA Nona Testing',
  email: 'qa.nona@yopmail.com',
  phoneNumber: '081234567890',
  password: 'Password123!',
  roleName: 'QA Nona Super Admin',
};

test.describe('BOT PPOB NONA - Menu User @regression', () => {
  test('1. Tambah user QA Nona Testing dengan role QANONA lalu verifikasi @smoke', async ({ page }) => {
    const nona = await PpobNonaPage.open(page);
    await nona.openRolePage();
    await nona.ensureRole(ROLE);

    await nona.openUserPage();
    await nona.ensureUser(USER);

    await nona.openUserPage();
    await nona.search(USER.email);
    const row = nona.rowFor(USER.email);
    await expect(row).toBeVisible({ timeout: 15000 });
    await expect(row.getByText(USER.email, { exact: true })).toBeVisible();
    await expect(row.getByText(USER.fullName, { exact: true })).toBeVisible();
    await expect(row.getByText(USER.roleName, { exact: true })).toBeVisible();
    await expect(row.getByText('Aktif', { exact: true })).toBeVisible();
  });

  test('2. Edit user qa.nona@yopmail.com menjadi QA Nona Updated @smoke', async ({ page }) => {
    const nona = await PpobNonaPage.open(page);
    await nona.openUserPage();
    await nona.ensureUser({
      fullName: 'QA Nona Updated',
      email: 'qa.nona@yopmail.com',
      phoneNumber: '081298765432',
      password: 'Password123!',
      roleName: 'QA Nona Super Admin',
    });

    await nona.openUserPage();
    await nona.search('qa.nona@yopmail.com');
    const row = nona.rowFor('qa.nona@yopmail.com');
    await expect(row).toBeVisible({ timeout: 15000 });
    await expect(row.getByText('QA Nona Updated', { exact: true })).toBeVisible();
    await expect(row.getByText('081298765432', { exact: true })).toBeVisible();
    await expect(row.getByText('Aktif', { exact: true })).toBeVisible();
  });

  test('3. User qa.nona@yopmail.com: nonaktifkan lalu aktifkan lagi @smoke', async ({ page }) => {
    const nona = await PpobNonaPage.open(page);
    await nona.openUserPage();

    // Nonaktifkan
    await nona.openEditUserForm('qa.nona@yopmail.com');
    await nona.setStatus(false);
    await nona.save();
    await nona.page.waitForTimeout(1500);
    await nona.openUserPage();
    await nona.search('qa.nona@yopmail.com');
    const row = nona.rowFor('qa.nona@yopmail.com');
    await expect(row).toBeVisible({ timeout: 15000 });
    await expect(row.getByText('Tidak Aktif', { exact: true })).toBeVisible();

    // Aktifkan kembali
    await nona.openEditUserForm('qa.nona@yopmail.com');
    await nona.setStatus(true);
    await nona.save();
    await nona.page.waitForTimeout(1500);
    await nona.openUserPage();
    await nona.search('qa.nona@yopmail.com');
    await expect(nona.rowFor('qa.nona@yopmail.com')).toBeVisible({ timeout: 15000 });
    await expect(nona.rowFor('qa.nona@yopmail.com').getByText('Aktif', { exact: true })).toBeVisible();
  });
});
