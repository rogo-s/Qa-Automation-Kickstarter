import { test, expect } from '@playwright/test';
import { PortalMasterPage } from '../../shared/pages/PortalMasterPage';

test.describe.configure({ mode: 'serial' });

/**
 * Flow E2E Master Data Portal BOT (1x login via auth.setup.ts):
 * 1. Tambah Role SUPERQA / QA SUPER ADMIN (akses semua menu, status aktif)
 * 2. Tambah User QA User (role QA Super Admin, app BOT ICONNET, status aktif)
 * 3. Menu: verifikasi form tambah menu menampilkan semua field
 */
test.describe('Portal BOT - Master Data Flow @regression', () => {
  test('1. Tambah role SUPERQA / QA SUPER ADMIN lalu verifikasi @smoke', async ({ page }) => {
    const portal = new PortalMasterPage(page);
    await portal.openRolePage();
    await portal.openUserPage();
    await portal.deleteUserIfExists('testing@yopmail.com');
    await portal.openRolePage();
    await portal.deleteRoleIfExists('SUPERQA');
    await portal.openAddRoleForm();

    await portal.fillRoleForm({
      code: 'SUPERQA',
      name: 'QA SUPER ADMIN',
      description: 'Role QA Super Admin dibuat oleh automation test',
    });
    await portal.setStatusActive();
    await portal.grantAllAccess();
    await portal.save();

    await expect(page.getByRole('cell', { name: 'SUPERQA', exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('cell', { name: 'QA SUPER ADMIN', exact: true })).toBeVisible({ timeout: 15000 });
  });

  test('2. Tambah user QA User dengan role QA Super Admin & app BOT ICONNET @smoke', async ({ page }) => {
    const portal = new PortalMasterPage(page);
    await portal.openUserPage();
    await portal.deleteUserIfExists('testing@yopmail.com');
    await portal.openAddUserForm();

    await portal.fillUserForm({
      fullname: 'QA User',
      email: 'testing@yopmail.com',
      phoneNumber: '0896' + String(Date.now()).slice(-8),
      password: 'Password@123',
    });
    await portal.selectApplications([
      'BOT ICONNET',
      'Non Kelistrikan',
      'Kelistrikan',
      'PLN VOUCHER',
      'BOT Miniapp',
      'Biller Aggregator',
      'Payment Gateway',
      'BOT PPOB NONA',
    ]);
    await portal.selectRole('QA SUPER ADMIN');
    await portal.setStatusActive();
    await portal.save();
    await portal.search('testing@yopmail.com');

    await expect(page.getByRole('cell', { name: 'testing@yopmail.com' })).toBeVisible({ timeout: 15000 });
  });

  test('3. Menu: form tambah menu menampilkan semua field @smoke', async ({ page }) => {
    const portal = new PortalMasterPage(page);
    await portal.openMenuPage();
    await portal.openAddMenuForm();

    await expect(page.getByPlaceholder('Masukan nama menu')).toBeVisible();
    await expect(page.getByPlaceholder('Masukan kode')).toBeVisible();
    await expect(page.getByText('Tidak ada parent')).toBeVisible();
    await expect(page.getByPlaceholder('Masukan deskripsi')).toBeVisible();
    await expect(page.getByRole('switch')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Simpan' })).toBeVisible();
  });
});
