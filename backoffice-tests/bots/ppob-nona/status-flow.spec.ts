import { test, expect } from '@playwright/test';
import { PpobNonaPage } from '../../../shared/pages/PpobNonaPage';

/**
 * Flow E2E Status BOT PPOB NONA (data diasumsikan sudah ada dari master-flow):
 * 1. Role QANONA: nonaktifkan lalu aktifkan lagi (via form Ubah, switch Status)
 * 2. User qa.nona@yopmail.com: nonaktifkan lalu aktifkan lagi (via form Ubah, switch Status)
 */
test.describe.configure({ mode: 'serial', timeout: 240000 });

test.describe('BOT PPOB NONA - Status Flow @regression', () => {
  test('1. Role QANONA: nonaktifkan lalu aktifkan lagi @smoke', async ({ page }) => {
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

  test('2. User qa.nona@yopmail.com: nonaktifkan lalu aktifkan lagi @smoke', async ({ page }) => {
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
