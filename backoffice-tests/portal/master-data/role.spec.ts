import { test, expect } from '@playwright/test';
import { PortalMasterPage } from '../../../shared/pages/PortalMasterPage';

test.describe.configure({ mode: 'serial', timeout: 240000 });

/**
 * Menu Role - Portal BOT (1x login via auth.setup.ts):
 * 1. Tambah Role SUPERQA / QA SUPER ADMIN (akses semua menu, status aktif)
 * 2. Edit role: ubah jadi QAPENTESTER / Pentester satu, akses view only
 * 3. Role QAPENTESTER: nonaktifkan lalu aktifkan kembali (via form Ubah / switch Status)
 */
test.describe('Portal BOT - Menu Role @regression', () => {
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
    await portal.search('SUPERQA');

    await expect(page.getByRole('cell', { name: 'SUPERQA', exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('cell', { name: 'QA SUPER ADMIN', exact: true })).toBeVisible({ timeout: 15000 });
  });

  test('2. Edit role: QAPENTESTER, Pentester satu, akses view only @smoke', async ({ page }) => {
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

  test('3. Role QAPENTESTER: nonaktifkan lalu aktifkan lagi @smoke', async ({ page }) => {
    const portal = new PortalMasterPage(page);

    await portal.openRolePage();
    await expect(page.getByRole('cell', { name: 'QAPENTESTER', exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('row', { name: /QAPENTESTER/ })).toContainText('Aktif', { timeout: 10000 });

    // nonaktifkan
    await portal.setRoleStatus('QAPENTESTER', false);
    await portal.search('QAPENTESTER');
    await expect(page.getByRole('row', { name: /QAPENTESTER/ })).toContainText('Tidak Aktif', { timeout: 15000 });

    // aktifkan kembali
    await portal.setRoleStatus('QAPENTESTER', true);
    await portal.search('QAPENTESTER');
    await expect(page.getByRole('row', { name: /QAPENTESTER/ })).toContainText('Aktif', { timeout: 15000 });
  });
});
