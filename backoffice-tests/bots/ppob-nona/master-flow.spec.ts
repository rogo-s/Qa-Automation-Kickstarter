import { test, expect } from '@playwright/test';
import { PpobNonaPage } from '../../../shared/pages/PpobNonaPage';

/**
 * Flow E2E Master Data BOT PPOB NONA (session dari auth.setup.ts, buka webview via popup):
 * 1. Tambah role QANONA / QA Nona Admin (semua permission, status aktif)
 * 2. Tambah user QA Nona Testing (role QA Nona Admin, status aktif)
 */
test.describe.configure({ mode: 'serial', timeout: 240000 });

const ROLE = { code: 'QANONA', name: 'QA Nona Admin', description: 'Role QA dibuat oleh automation test BOT PPOB NONA' };
const USER = {
  fullName: 'QA Nona Testing',
  email: 'qa.nona@yopmail.com',
  phoneNumber: '081234567890',
  password: 'Password123!',
  roleName: 'QA Nona Admin',
};

test.describe('BOT PPOB NONA - Master Data Flow @regression', () => {
  test('1. Tambah role QANONA / QA Nona Admin lalu verifikasi @smoke', async ({ page }) => {
    const nona = await PpobNonaPage.open(page);
    await nona.openRolePage();
    await nona.ensureRole(ROLE);

    await nona.openRolePage();
    await nona.search(ROLE.code);
    const row = nona.rowFor(ROLE.code);
    await expect(row).toBeVisible({ timeout: 15000 });
    await expect(row.getByText(ROLE.code, { exact: true })).toBeVisible();
    await expect(row.getByText(ROLE.name, { exact: true })).toBeVisible();
    await expect(row.getByText('Aktif', { exact: true })).toBeVisible();
  });

  test('2. Tambah user QA Nona Testing dengan role QANONA lalu verifikasi @smoke', async ({ page }) => {
    const nona = await PpobNonaPage.open(page);
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
});
