import { test, expect } from '@playwright/test';
import { PpobNonaMenuPage } from '../../../shared/pages/PpobNonaMenuPage';

/**
 * Master Data Menu - BOT PPOB NONA (session auth.setup.ts, webview via popup):
 * 1. Validasi form: Simpan disabled sampai field wajib terisi (title, code, icon,
 *    permission, description). Parent/urutan/switch tidak wajib.
 * 2. Tambah menu (icon default, parent Master, urutan bebas, permission ditulis)
 * 3. Edit menu (pakai data yang sudah di-insert, bukan bikin baru) lalu verifikasi
 * 4. Status menu: nonaktifkan lalu aktifkan lagi
 *
 * Catatan:
 *  - Menu TIDAK punya fitur hapus, sehingga data memakai KONSTANTA TETAP
 *    (bukan timestamp). Saat test dijalankan ulang, case tambah akan SKIP bila
 *    data sudah ada, dan case edit/status memakai data existing -> tidak ada spam.
 *  - Parent memakai dropdown pilih "Master"; urutan bebas (Sort Order 3);
 *    permission ditulis: CREATE,EDIT,VIEW,DELETE,READ.
 */
test.describe.configure({ mode: 'serial', timeout: 240000 });

const MENU_TITLE = 'QA Menu Tes';
const MENU_CODE = 'qamenutes';
const MENU_ICON = 'lucide-layout';
const MENU_PARENT = 'Master';
const MENU_SORT = '3';
const MENU_PERMISSION = 'CREATE,EDIT,VIEW,DELETE,READ';
const EDITED_TITLE = MENU_TITLE + ' Updated';

test.describe('BOT PPOB NONA - Menu Menu @regression', () => {
  test('1. Validasi form tambah: Simpan disabled sampai field wajib terisi @smoke', async ({ page }) => {
    const menu = await PpobNonaMenuPage.open(page);
    await menu.openAddMenuForm();

    await expect(menu.isSaveDisabled()).resolves.toBeTruthy();

    await menu.fillForm({ title: 'Menu Tes' });
    await expect(menu.isSaveDisabled()).resolves.toBeTruthy();

    await menu.fillForm({ title: 'Menu Tes', code: 'menutes', icon: MENU_ICON, permissionString: MENU_PERMISSION });
    await expect(menu.isSaveDisabled()).resolves.toBeTruthy();

    await menu.fillForm({ description: 'Menu tes' });
    await expect(menu.isSaveDisabled()).resolves.toBeFalsy();
  });

  test('2. Tambah menu lalu verifikasi muncul di tabel @smoke', async ({ page }) => {
    const menu = await PpobNonaMenuPage.open(page);

    // Bila data sudah ada dari run sebelumnya, jangan tambah lagi (hindari spam)
    if (await menu.hasRow(MENU_CODE)) {
      const row = menu.rowFor(MENU_CODE);
      await expect(row).toBeVisible({ timeout: 10000 });
    } else {
      await menu.openAddMenuForm();
      await menu.fillForm({
        title: MENU_TITLE,
        code: MENU_CODE,
        icon: MENU_ICON,
        parent: MENU_PARENT,
        sortOrder: MENU_SORT,
        permissionString: MENU_PERMISSION,
        description: 'Menu untuk test QA',
      });
      await menu.setStatus(true);
      await menu.save();
    }

    await expect(menu.hasRow(MENU_CODE)).resolves.toBeTruthy();
    const row = menu.rowFor(MENU_CODE);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(MENU_CODE);
    await expect(row).toContainText(MENU_PARENT);
    await expect(row).toContainText('Aktif');
  });

  test('3. Edit menu: ubah nama memakai data existing lalu verifikasi @smoke', async ({ page }) => {
    const menu = await PpobNonaMenuPage.open(page);

    await menu.openEditMenuForm(MENU_CODE);
    await menu.fillForm({ title: EDITED_TITLE });
    await menu.save();

    await expect(menu.hasRow(MENU_CODE)).resolves.toBeTruthy();
    const row = menu.rowFor(MENU_CODE);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(EDITED_TITLE);
    await expect(row).toContainText(MENU_PARENT);
  });

  test('4. Menu: nonaktifkan lalu aktifkan lagi @smoke', async ({ page }) => {
    const menu = await PpobNonaMenuPage.open(page);

    await menu.openEditMenuForm(MENU_CODE);
    await menu.setStatus(false);
    await menu.save();

    await expect(menu.hasRow(MENU_CODE)).resolves.toBeTruthy();
    await expect(menu.rowFor(MENU_CODE)).toContainText('Tidak Aktif');

    await menu.openEditMenuForm(MENU_CODE);
    await menu.setStatus(true);
    await menu.save();

    await expect(menu.hasRow(MENU_CODE)).resolves.toBeTruthy();
    await expect(menu.rowFor(MENU_CODE)).toContainText('Aktif');
  });
});