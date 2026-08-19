import { test, expect } from '@playwright/test';
import { BaMenuPage } from '../../../shared/pages/BaMenuPage';

/**
 * Master Data Menu - BOT BA (Biller Aggregator).
 * Pola CRUD sama dengan PPOB NONA: SEARCH/cek data dulu, baru eksekusi.
 *
 * CATATAN PENTING (finding BA-003): hapus menu selalu ditolak 403 di playground
 * ("Anda tidak memiliki izin..."), sehingga:
 *  - Test add bersifat idempoten (skip bila data sudah ada, TIDAK bisa dibersihkan).
 *  - Test hapus memverifikasi pesan 403 tampil dan baris tetap ada.
 *
 * 1. Validasi form: Simpan disabled sampai field wajib terisi
 * 2. Cek data ada/tidak -> Tambah menu (bila belum ada) -> verifikasi
 * 3. Cek data ada -> Edit nama -> verifikasi
 * 4. Cek data ada -> Nonaktifkan lalu aktifkan lagi -> verifikasi status
 * 5. Cek data ada -> Hapus -> konfirmasi -> error 403 tampil, baris tetap ada
 * 6. Tambah dengan kode duplikat -> dialog tetap terbuka (simpan ditolak)
 */
test.describe.configure({ mode: 'serial', timeout: 360000 });

const MENU_TITLE = 'QA MENU TES';
const MENU_TITLE_EDITED = 'QA MENU TES EDIT';
const MENU_CODE = 'qamenutes';
const MENU_ICON = 'lucide-layout';
const MENU_DESC = 'Menu buatan QA';

test.describe('BOT BA - Menu Menu @regression', () => {
  test('1. Validasi form tambah: Simpan disabled sampai field wajib terisi @smoke', async ({ page }) => {
    const menu = await BaMenuPage.open(page);
    await menu.openAddForm();

    await expect(menu.isSaveDisabled()).resolves.toBeTruthy();

    await menu.fillForm({ title: MENU_TITLE });
    await expect(menu.isSaveDisabled()).resolves.toBeTruthy();

    await menu.fillForm({ code: MENU_CODE });
    await expect(menu.isSaveDisabled()).resolves.toBeTruthy();

    await menu.fillForm({ icon: MENU_ICON });
    await expect(menu.isSaveDisabled()).resolves.toBeTruthy();

    await menu.selectParent('Master');
    await expect(menu.isSaveDisabled()).resolves.toBeTruthy();

    await menu.selectUrutan('3');
    await expect(menu.isSaveDisabled()).resolves.toBeTruthy();

    await menu.selectTipe('Internal');
    await expect(menu.isSaveDisabled()).resolves.toBeTruthy();

    await menu.addCustomAction('VIEW');
    await expect(menu.isSaveDisabled()).resolves.toBeTruthy();

    await menu.fillForm({ description: MENU_DESC });
    await expect(menu.isSaveDisabled()).resolves.toBeFalsy();

    await menu.closeForm();
  });

  test('2. Cek data ada/tidak, lalu Tambah menu & verifikasi @smoke', async ({ page }) => {
    const menu = await BaMenuPage.open(page);

    // Delete terlarang (403), jadi tambah hanya bila data belum ada.
    if (await menu.hasRow(MENU_CODE)) {
      const row = menu.rowFor(MENU_CODE);
      await expect(row).toBeVisible({ timeout: 10000 });
    } else {
      await menu.openAddForm();
      await menu.fillForm({ title: MENU_TITLE, code: MENU_CODE, icon: MENU_ICON, description: MENU_DESC });
      await menu.selectParent('Master');
      await menu.selectUrutan('3');
      await menu.selectTipe('Internal');
      await menu.addCustomAction('VIEW');
      await menu.save();
    }

    await expect(menu.hasRow(MENU_CODE)).resolves.toBeTruthy();
    const row = menu.rowFor(MENU_CODE);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(MENU_CODE);
    await expect(row).toContainText('Master');
    await expect(row).toContainText('INTERNAL');
  });

  test('3. Cek data ada, lalu Edit nama & verifikasi @smoke', async ({ page }) => {
    const menu = await BaMenuPage.open(page);

    expect(await menu.hasRow(MENU_CODE)).toBeTruthy();

    await menu.openEditForm(MENU_CODE);
    await menu.fillForm({ title: MENU_TITLE_EDITED });
    await menu.save();

    await expect(menu.hasRow(MENU_CODE)).resolves.toBeTruthy();
    const row = menu.rowFor(MENU_CODE);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(MENU_TITLE_EDITED);
  });

  test('4. Cek data ada, lalu nonaktifkan & aktifkan lagi @smoke', async ({ page }) => {
    const menu = await BaMenuPage.open(page);

    expect(await menu.hasRow(MENU_CODE)).toBeTruthy();

    await menu.openEditForm(MENU_CODE);
    await menu.setStatus(false);
    await menu.save();
    await expect(menu.hasRow(MENU_CODE)).resolves.toBeTruthy();
    await expect(menu.rowFor(MENU_CODE)).toContainText('Tidak Aktif');

    await menu.openEditForm(MENU_CODE);
    await menu.setStatus(true);
    await menu.save();
    await expect(menu.hasRow(MENU_CODE)).resolves.toBeTruthy();
    await expect(menu.rowFor(MENU_CODE)).toContainText('Aktif');
  });

  test('5. Cek data ada, lalu Hapus: ditolak 403 & baris tetap ada @smoke', async ({ page }) => {
    const menu = await BaMenuPage.open(page);

    expect(await menu.hasRow(MENU_CODE)).toBeTruthy();

    await menu.deleteMenu(MENU_CODE);

    // BA-003: playground menolak hapus menu dengan 403
    await expect(menu.page.getByText(/tidak memiliki izin/).first()).toBeVisible({ timeout: 10000 });
    await expect(menu.hasRow(MENU_CODE)).resolves.toBeTruthy();
  });

  test('6. Tambah dengan kode duplikat: simpan ditolak, dialog tetap terbuka @smoke', async ({ page }) => {
    const menu = await BaMenuPage.open(page);

    await menu.openAddForm();
    await menu.fillForm({ title: 'QA MENU DUP', code: 'bank_internal', icon: MENU_ICON, description: 'Duplikat' });
    await menu.selectParent('Master');
    await menu.selectUrutan('3');
    await menu.selectTipe('Internal');
    await menu.addCustomAction('VIEW');
    await menu.save();

    await expect(menu.formDialog()).toHaveCount(1, { timeout: 10000 });
    await menu.closeForm();
    await expect(menu.hasRow('QA MENU DUP')).resolves.toBeFalsy();
  });
});
