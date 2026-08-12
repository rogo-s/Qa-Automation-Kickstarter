import { test, expect } from '@playwright/test';
import { PpobNonaPage } from '../../../shared/pages/PpobNonaPage';

/**
 * Menu Role - BOT PPOB NONA (session dari auth.setup.ts, buka webview via popup):
 * 1. Tambah role QANONA / QA Nona Admin (semua permission, status aktif)
 * 2. Edit role QANONA -> nama QA Nona Super Admin, status tetap aktif
 * 3. Role QANONA: nonaktifkan lalu aktifkan lagi (via form Ubah, switch Status)
 */
test.describe.configure({ mode: 'serial', timeout: 240000 });

test.describe('BOT PPOB NONA - Menu Role @regression', () => {
  test('1. Tambah role QANONA / QA Nona Admin lalu verifikasi @smoke', async ({ page }) => {
    const nona = await PpobNonaPage.open(page);
    await nona.openRolePage();
    await nona.ensureRole({
      code: 'QANONA',
      name: 'QA Nona Admin',
      description: 'Role QA dibuat oleh automation test BOT PPOB NONA',
    });

    await nona.openRolePage();
    await nona.search('QANONA');
    const row = nona.rowFor('QANONA');
    await expect(row).toBeVisible({ timeout: 15000 });
    await expect(row.getByText('QANONA', { exact: true })).toBeVisible();
    await expect(row.getByText('QA Nona Admin', { exact: true })).toBeVisible();
    await expect(row.getByText('Aktif', { exact: true })).toBeVisible();
  });

  test('2. Edit role QANONA menjadi QA Nona Super Admin @smoke', async ({ page }) => {
    const nona = await PpobNonaPage.open(page);
    await nona.openRolePage();
    await nona.ensureRole({
      code: 'QANONA',
      name: 'QA Nona Super Admin',
      description: 'Role QA edited by automation test',
    });

    await nona.openRolePage();
    await nona.search('QANONA');
    const row = nona.rowFor('QANONA');
    await expect(row).toBeVisible({ timeout: 15000 });
    await expect(row.getByText('QA Nona Super Admin', { exact: true })).toBeVisible();
    await expect(row.getByText('Aktif', { exact: true })).toBeVisible();
  });

  test('3. Role QANONA: nonaktifkan lalu aktifkan lagi @smoke', async ({ page }) => {
    const nona = await PpobNonaPage.open(page);
    await nona.openRolePage();

    // Nonaktifkan
    await nona.openEditRoleForm('QANONA');
    await nona.setStatus(false);
    await nona.save();
    await nona.page.waitForTimeout(1500);
    await nona.openRolePage();
    await nona.search('QANONA');
    const row = nona.rowFor('QANONA');
    await expect(row).toBeVisible({ timeout: 15000 });
    await expect(row.getByText('Tidak Aktif', { exact: true })).toBeVisible();

    // Aktifkan kembali
    await nona.openEditRoleForm('QANONA');
    await nona.setStatus(true);
    await nona.save();
    await nona.page.waitForTimeout(1500);
    await nona.openRolePage();
    await nona.search('QANONA');
    await expect(nona.rowFor('QANONA')).toBeVisible({ timeout: 15000 });
    await expect(nona.rowFor('QANONA').getByText('Aktif', { exact: true })).toBeVisible();
  });
});
