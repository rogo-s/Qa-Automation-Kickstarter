import { test, expect } from '@playwright/test';
import { PortalMasterPage } from '../../../shared/pages/PortalMasterPage';

test.describe.configure({ mode: 'serial', timeout: 240000 });

/**
 * Menu User - Portal BOT (1x login via auth.setup.ts):
 * 1. Tambah user QA User (role QA SUPER ADMIN, app BOT ICONNET + sub-app, status aktif)
 * 2. Edit user: Penestrasi testing, role QAPENTESTER (Pentester satu)
 * 3. User pentest@yopmail.com: nonaktifkan lalu aktifkan kembali
 */
test.describe('Portal BOT - Menu User @regression', () => {
  test('1. Tambah user QA User dengan role QA SUPER ADMIN & app BOT ICONNET @smoke', async ({ page }) => {
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

  test('2. Edit user: Penestrasi testing, role QAPENTESTER @smoke', async ({ page }) => {
    const portal = new PortalMasterPage(page);

    // setup (konsep add, biar repeatable): user dibuat dulu dgn role QAPENTESTER
    await portal.openUserPage();
    await portal.deleteUserIfExists('pentest@yopmail.com');
    await portal.openAddUserForm();
    await portal.fillUserForm({
      fullname: 'User Pentest Awal',
      email: 'pentest@yopmail.com',
      phoneNumber: '089600000001',
      password: 'Password@123',
    });
    await portal.selectApplications(['BOT ICONNET']);
    await portal.selectRole('Pentester satu');
    await portal.setStatusActive();
    await portal.save();
    await portal.search('pentest@yopmail.com');
    await expect(page.getByRole('cell', { name: 'pentest@yopmail.com' })).toBeVisible({ timeout: 15000 });

    // edit user: ubah data, role tetap QAPENTESTER (mengikuti role yang diedit)
    await portal.openEditUserForm('pentest@yopmail.com');
    await portal.fillUserForm({
      fullname: 'Penestrasi testing',
      email: 'pentest@yopmail.com',
      phoneNumber: '086736483824',
      password: 'Password@321',
    });
    await expect(
      page.getByRole('button', { name: 'Pentester satu', exact: true }).first(),
    ).toBeVisible({ timeout: 10000 });
    await portal.save();
    await portal.search('pentest@yopmail.com');

    await expect(page.getByRole('cell', { name: 'pentest@yopmail.com' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('cell', { name: 'Penestrasi testing', exact: true })).toBeVisible({ timeout: 15000 });
  });

  test('3. User pentest@yopmail.com: nonaktifkan lalu aktifkan lagi @smoke', async ({ page }) => {
    const portal = new PortalMasterPage(page);

    await portal.openUserPage();
    await expect(page.getByRole('cell', { name: 'pentest@yopmail.com' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('row', { name: /pentest@yopmail.com/ })).toContainText('Aktif', { timeout: 10000 });

    // nonaktifkan
    await portal.deactivateUser('pentest@yopmail.com');
    await portal.search('pentest@yopmail.com');
    await expect(page.getByRole('row', { name: /pentest@yopmail.com/ })).toContainText('Tidak Aktif', { timeout: 15000 });

    // aktifkan kembali
    await portal.activateUser('pentest@yopmail.com');
    await portal.search('pentest@yopmail.com');
    await expect(page.getByRole('row', { name: /pentest@yopmail.com/ })).toContainText('Aktif', { timeout: 15000 });
  });
});
