import { test, expect } from '@playwright/test';
import { BaRolePage } from '../../../shared/pages/BaRolePage';

/**
 * Master Data Manage Role - BOT BA (Biller Aggregator).
 * Pola CRUD sama dengan PPOB NONA: SEARCH/cek data dulu, baru eksekusi.
 *
 * 1. Validasi form: Simpan disabled sampai nama + aplikasi + tipe + deskripsi terisi
 * 2. Simpan tanpa permission -> error "Role minimal memiliki satu akses menu dan action"
 * 3. Cek data ada/tidak -> bersihkan bila ada -> Tambah role -> verifikasi di list
 * 4. Cek data ada -> Edit nama -> verifikasi
 * 5. Cek data ada -> Hapus (konfirmasi) -> verifikasi hilang
 */
test.describe.configure({ mode: 'serial', timeout: 300000 });

const ROLE_NAME = 'QA ROLE TES';
const ROLE_NAME_EDITED = ROLE_NAME + ' EDIT';
const ROLE_DESC = 'Role buatan QA untuk test CRUD';

test.describe('BOT BA - Menu Manage Role @regression', () => {
  test('1. Validasi form tambah: Simpan disabled sampai field wajib terisi @smoke', async ({ page }) => {
    const role = await BaRolePage.open(page);
    await role.openAddForm();

    await expect(role.isSaveDisabled()).resolves.toBeTruthy();

    await role.fillName(ROLE_NAME);
    await expect(role.isSaveDisabled()).resolves.toBeTruthy();

    await role.selectApp('Internal');
    await expect(role.isSaveDisabled()).resolves.toBeTruthy();

    await role.selectTipe('Internal');
    await role.fillDescription(ROLE_DESC);
    await expect(role.isSaveDisabled()).resolves.toBeFalsy();

    await role.cancel();
  });

  test('2. Simpan tanpa permission: error "minimal memiliki satu akses menu dan action" @smoke', async ({ page }) => {
    const role = await BaRolePage.open(page);
    await role.openAddForm();

    await role.fillName(ROLE_NAME);
    await role.selectApp('Internal');
    await role.selectTipe('Internal');
    await role.fillDescription(ROLE_DESC);
    await role.saveButton().click();
    await role.page.waitForTimeout(3000);

    await expect(role.page.getByText('Role minimal memiliki satu akses menu dan action').first()).toBeVisible({ timeout: 10000 });
    await role.cancel();
  });

  test('3. Cek data ada/tidak, lalu Tambah role dengan permission & verifikasi @smoke', async ({ page }) => {
    const role = await BaRolePage.open(page);

    // Cek dulu: bila sisa dari run sebelumnya, hapus supaya tidak dobel.
    if (await role.hasRow(ROLE_NAME)) {
      await role.deleteRole(ROLE_NAME);
      await expect(role.hasRow(ROLE_NAME)).resolves.toBeFalsy();
    }

    await role.openAddForm();
    await role.fillName(ROLE_NAME);
    await role.selectApp('Internal');
    await role.selectTipe('Internal');
    await role.fillDescription(ROLE_DESC);
    await role.grantDashboardPermissions();
    await role.save();

    await expect(role.hasRow(ROLE_NAME)).resolves.toBeTruthy();
    const row = role.rowFor(ROLE_NAME);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(ROLE_DESC);
    await expect(row).toContainText('INTERNAL');
  });

  test('4. Cek data ada, lalu Edit nama & verifikasi @smoke', async ({ page }) => {
    const role = await BaRolePage.open(page);

    expect(await role.hasRow(ROLE_NAME)).toBeTruthy();

    await role.openEditForm(ROLE_NAME);
    await role.fillName(ROLE_NAME_EDITED);
    await role.save();

    await expect(role.hasRow(ROLE_NAME_EDITED)).resolves.toBeTruthy();
    const row = role.rowFor(ROLE_NAME_EDITED);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText('INTERNAL');
  });

  test('5. Cek data ada, lalu Hapus dengan konfirmasi @smoke', async ({ page }) => {
    const role = await BaRolePage.open(page);

    expect(await role.hasRow(ROLE_NAME_EDITED)).toBeTruthy();

    await role.deleteRole(ROLE_NAME_EDITED);

    await expect(role.hasRow(ROLE_NAME_EDITED)).resolves.toBeFalsy();
  });

  test('6. Tambah dengan nama duplikat: "Nama role sudah digunakan" & data tidak bertambah @smoke', async ({ page }) => {
    const role = await BaRolePage.open(page);

    // Role "DevOps" sudah ada di playground (data statis)
    await role.openAddForm();
    await role.fillName('DevOps');
    await role.selectApp('Internal');
    await role.selectTipe('Internal');
    await role.fillDescription('Duplikat nama DevOps');
    await role.grantDashboardPermissions();
    await role.saveButton().click();
    await role.page.waitForTimeout(3000);

    await expect(role.page.getByText('Nama role sudah digunakan').first()).toBeVisible({ timeout: 10000 });
    await role.cancel();
    // jumlah baris DevOps tetap 1
    await expect(role.page.locator('main tbody tr', { hasText: 'DevOps' })).toHaveCount(1);
  });
});
