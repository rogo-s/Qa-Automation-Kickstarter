import { test, expect } from '@playwright/test';
import { PortalMasterPage } from '../../../shared/pages/PortalMasterPage';

test.describe.configure({ mode: 'serial', timeout: 240000 });

/**
 * Flow E2E Edit/Update Master Data Portal BOT (1x login via auth.setup.ts):
 * 1. Edit role: ubah jadi QAPENTESTER / Pentester satu, akses view only
 * 2. Edit user: ubah jadi Penestrasi testing, role tetap QAPENTESTER
 * Setup memakai konsep add (delete-if-exists lalu create) agar flow bisa di-repeat,
 * setelah itu dilakukan operasi edit (Ubah Role / Edit Pengguna).
 */
test.describe('Portal BOT - Edit Flow @regression', () => {
  test('1. Edit role: QAPENTESTER, Pentester satu, akses view only @smoke', async ({ page }) => {
    const portal = new PortalMasterPage(page);

    // setup (konsep add, biar repeatable): role QAPENTESTER dibuat dulu dgn akses penuh.
    // User yang masih memakai role ini harus dihapus lebih dulu, kalau tidak role tidak bisa dihapus.
    await portal.openUserPage();
    await portal.deleteUserIfExists('pentest@yopmail.com');
    await portal.openRolePage();
    await portal.deleteRoleIfExists('QAPENTESTER');
    await portal.openAddRoleForm();
    await portal.fillRoleForm({
      code: 'QAPENTESTER',
      name: 'Role QA Pentester',
      description: 'role dibuat oleh automation test (sebelum edit)',
    });
    await portal.setStatusActive();
    await portal.grantAllAccess();
    await portal.save();
    await portal.search('QAPENTESTER');
    await expect(page.getByRole('cell', { name: 'QAPENTESTER', exact: true })).toBeVisible({ timeout: 15000 });

    // edit role: ubah data & akses jadi view only
    await portal.openEditRoleForm('QAPENTESTER');
    await portal.fillRoleForm({
      code: 'QAPENTESTER',
      name: 'Pentester satu',
      description: 'role qa pentester dibuat oleh automation test',
    });
    await portal.setStatusActive();
    await portal.setViewOnlyAccess();
    await portal.save();
    await portal.search('QAPENTESTER');

    await expect(page.getByRole('cell', { name: 'QAPENTESTER', exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('cell', { name: 'Pentester satu', exact: true })).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByRole('cell', { name: 'role qa pentester dibuat oleh automation test', exact: true }),
    ).toBeVisible({ timeout: 15000 });

    // verifikasi akses view only tersimpan: hanya View yang checked
    await portal.openEditRoleForm('QAPENTESTER');
    const states = await portal.readAccessStates();
    for (const action of ['Add', 'Delete', 'Edit', 'Disable']) {
      expect(states[action]?.every((s) => s === 'unchecked')).toBeTruthy();
    }
    expect(states.View?.every((s) => s === 'checked')).toBeTruthy();
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
});
