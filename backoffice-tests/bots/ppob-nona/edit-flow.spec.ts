import { test, expect } from '@playwright/test';
import { PpobNonaPage } from '../../../shared/pages/PpobNonaPage';

/**
 * Flow E2E Edit BOT PPOB NONA (data diasumsikan sudah ada dari master-flow):
 * 1. Edit role QANONA -> nama QA Nona Super Admin, status tetap aktif
 * 2. Edit user qa.nona@yopmail.com -> nama QA Nona Updated, no telp baru (email tidak bisa diedit)
 */
test.describe.configure({ mode: 'serial', timeout: 240000 });

test.describe('BOT PPOB NONA - Edit Flow @regression', () => {
  test('1. Edit role QANONA menjadi QA Nona Super Admin @smoke', async ({ page }) => {
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
});
