import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object - Master Data (Role / Menu / User) pada Portal BOT.
 * Asumsi: session sudah ada (storageState dari auth.setup.ts), jadi tidak login ulang.
 */
export class PortalMasterPage {
  readonly page: Page;
  readonly roleHeading: Locator;
  readonly menuHeading: Locator;
  readonly userHeading: Locator;
  readonly addRoleButton: Locator;
  readonly addMenuButton: Locator;
  readonly addUserButton: Locator;
  readonly searchInput: Locator;
  readonly roleTable: Locator;
  readonly roleRows: Locator;
  readonly simpanButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.roleHeading = page.getByRole('heading', { name: 'Role' });
    this.menuHeading = page.getByRole('heading', { name: 'Menu' });
    this.userHeading = page.getByRole('heading', { name: 'Daftar pengguna' });
    this.addRoleButton = page.getByRole('button', { name: 'Role', exact: true }).first();
    this.addMenuButton = page.getByRole('button', { name: 'Menu', exact: true }).first();
    this.addUserButton = page.getByRole('button', { name: 'Tambah Pengguna', exact: true }).first();
    this.searchInput = page.getByPlaceholder('Cari..');
    this.roleTable = page.locator('table');
    this.roleRows = page.locator('tbody tr');
    this.simpanButton = page.getByRole('button', { name: 'Simpan' });
  }

  async openRolePage() {
    await this.page.goto('/master/role');
    await expect(this.roleHeading).toBeVisible({ timeout: 15000 });
    await expect(this.addRoleButton).toBeVisible({ timeout: 15000 });
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  async openMenuPage() {
    await this.page.goto('/master/menu');
    await expect(this.menuHeading).toBeVisible({ timeout: 15000 });
    await expect(this.addMenuButton).toBeVisible({ timeout: 15000 });
  }

  async openUserPage() {
    await this.page.goto('/master/user');
    await expect(this.userHeading).toBeVisible({ timeout: 15000 });
    await expect(this.addUserButton).toBeVisible({ timeout: 15000 });
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  async openAddRoleForm() {
    await this.addRoleButton.click();
    await expect(this.page.getByRole('heading', { name: 'Tambah Role' })).toBeVisible({ timeout: 10000 });
  }

  async openAddMenuForm() {
    await this.addMenuButton.click();
    await expect(this.page.getByRole('heading', { name: 'Tambah Menu' })).toBeVisible({ timeout: 10000 });
  }

  async openAddUserForm() {
    await this.addUserButton.click();
    await expect(this.page.getByRole('heading', { name: 'Tambah Pengguna' })).toBeVisible({ timeout: 10000 });
  }

  async openEditRoleForm(code: string) {
    await this.search(code);
    const row = this.page.getByRole('row', { name: new RegExp(code) });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Ubah' }).click();
    await expect(this.page.getByRole('heading', { name: 'Ubah Role' })).toBeVisible({ timeout: 10000 });
  }

  async openEditUserForm(email: string) {
    await this.search(email);
    const row = this.page.getByRole('row', { name: new RegExp(email) });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Edit' }).click();
    await expect(this.page.getByRole('heading', { name: 'Edit Pengguna' })).toBeVisible({ timeout: 10000 });
  }

  async fillRoleForm({ code, name, description }: { code: string; name: string; description: string }) {
    await this.page.getByPlaceholder('Masukan kode').fill(code);
    await this.page.getByPlaceholder('Name', { exact: true }).fill(name);
    await this.page.getByPlaceholder('Description').fill(description);
  }

  async fillUserForm({
    fullname,
    email,
    phoneNumber,
    password,
  }: {
    fullname: string;
    email: string;
    phoneNumber: string;
    password: string;
  }) {
    await this.page.getByPlaceholder('Masukan nama lengkap').fill(fullname);
    await this.page.getByPlaceholder('Masukan email').fill(email);
    await this.page.getByPlaceholder('Masukan Nomor Handphone').fill(phoneNumber);
    await this.page.getByPlaceholder('Masukan kata sandi kamu').fill(password);
  }

  /** Set status aktif (switch ON). */
  async setStatusActive() {
    const sw = this.page.getByRole('main').getByRole('switch');
    if ((await sw.getAttribute('data-state')) !== 'checked') {
      await sw.click({ force: true });
    }
  }

  /** Set status role via form Ubah (aktif/nonaktif) lalu simpan. */
  async setRoleStatus(code: string, wantActive: boolean) {
    await this.openEditRoleForm(code);
    const sw = this.page.getByRole('main').getByRole('switch');
    const wantState = wantActive ? 'checked' : 'unchecked';
    if ((await sw.getAttribute('data-state')) !== wantState) {
      await sw.click({ force: true });
    }
    await this.save();
    await this.page.waitForTimeout(500);
  }

  /** Nonaktifkan user via menu Nonaktifkan (asumsi data sudah ada). */
  async deactivateUser(email: string) {
    await this.search(email);
    const row = this.page.getByRole('row', { name: new RegExp(email) });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Nonaktifkan' }).click();
    await this.confirmAction();
  }

  /** Aktifkan kembali user via menu Aktifkan. */
  async activateUser(email: string) {
    await this.search(email);
    const row = this.page.getByRole('row', { name: new RegExp(email) });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Aktifkan' }).click();
    await this.confirmAction();
  }

  private async confirmAction() {
    const confirm = this.page.getByRole('button', { name: /Lanjutkan|Ya|Konfirmasi/i });
    if (await confirm.count()) {
      await confirm.first().click();
    }
  }

  /** Beri akses SEMUA menu: buka grup Dashboard/Master Data/Aplikasi lalu centang semua checkbox. */
  async grantAllAccess() {
    const openCount = () =>
      this.page.evaluate(() => document.querySelectorAll('main [data-state="open"]').length);

    await this.page.getByRole('main').getByRole('button', { name: 'Dashboard', exact: true }).first()
      .waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    await this.page.waitForTimeout(1000);

    for (const group of ['Dashboard', 'Master Data', 'Aplikasi']) {
      const header = this.page.getByRole('main').getByRole('button', { name: group, exact: true }).first();
      if (!(await header.isVisible())) continue;
      const before = await openCount();
      await header.click();
      const opened = await this.page
        .waitForFunction(
          (prev) => document.querySelectorAll('main [data-state="open"]').length > prev,
          before,
          { timeout: 20000 },
        )
        .then(() => true)
        .catch(() => false);
      if (!opened) {
        await header.click();
        await this.page
          .waitForFunction(
            (prev) => document.querySelectorAll('main [data-state="open"]').length > prev,
            before,
            { timeout: 15000 },
          )
          .catch(() => {});
      }
    }

    const cbs = this.page.getByRole('main').getByRole('checkbox');
    await cbs.first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    for (let pass = 0; pass < 4; pass++) {
      for (let i = 0; i < (await cbs.count()); i++) {
        const cb = cbs.nth(i);
        if ((await cb.getAttribute('data-state')) !== 'checked') {
          await cb.click({ force: true }).catch(() => {});
        }
      }
      await this.page.waitForTimeout(300);
    }
  }

  /** Buka semua grup accordion Hak Akses (Dashboard / Master Data / Aplikasi). */
  private async openPermissionGroups() {
    for (const group of ['Dashboard', 'Master Data', 'Aplikasi']) {
      const header = this.page.getByRole('main').getByRole('button', { name: group, exact: true }).first();
      await header.scrollIntoViewIfNeeded().catch(() => {});
      await header.click();
      await this.page.waitForTimeout(400);
    }
  }

  /** Set akses role menjadi view only: centang View, kosongkan Add/Delete/Edit/Disable. */
  async setViewOnlyAccess() {
    await this.openPermissionGroups();
    const main = this.page.getByRole('main');

    const clickByAction = async (action: string, want: 'checked' | 'unchecked') => {
      const labels = main.locator('label', { hasText: new RegExp(`^${action}$`) });
      const n = await labels.count();
      for (let i = 0; i < n; i++) {
        const btn = labels.nth(i).locator('xpath=../button');
        const st = (await btn.getAttribute('data-state').catch(() => '')) ?? '';
        if (st !== want) await btn.click({ force: true }).catch(() => {});
      }
    };

    for (const action of ['Add', 'Delete', 'Edit', 'Disable']) await clickByAction(action, 'unchecked');
    await clickByAction('View', 'checked');
    await this.page.waitForTimeout(500);
  }

  /** Baca state akses per aksi, mis. { View: ['checked', ...], Add: ['unchecked', ...] }. */
  async readAccessStates(): Promise<Record<string, string[]>> {
    await this.openPermissionGroups();
    const main = this.page.getByRole('main');
    const result: Record<string, string[]> = {};
    for (const action of ['Add', 'Delete', 'Edit', 'View', 'Disable']) {
      const labels = main.locator('label', { hasText: new RegExp(`^${action}$`) });
      const n = await labels.count();
      result[action] = [];
      for (let i = 0; i < n; i++) {
        const btn = labels.nth(i).locator('xpath=../button');
        const st = (await btn.getAttribute('data-state').catch(() => '')) ?? '';
        result[action].push(st);
      }
    }
    return result;
  }

  /** Pilih aplikasi dari listbox (multi-pilih), mis. BOT ICONNET + sub-apps. */
  async selectApplications(apps: string[]) {
    const trigger = this.page
      .getByRole('main')
      .locator('label', { hasText: 'Aplikasi' })
      .locator('xpath=../button');
    await trigger.first().click();
    for (const app of apps) {
      const opt = this.page.getByRole('option', { name: app, exact: true });
      await opt.click({ force: true });
    }
    await this.page.keyboard.press('Escape');
  }

  /** Pilih role dari dropdown "Pilih Role". */
  async selectRole(roleName: string) {
    await this.page.getByRole('button', { name: 'Pilih Role' }).click();
    await this.page.getByRole('option', { name: roleName }).click();
  }

  async save() {
    await this.simpanButton.click();
  }

  /** Cari di tabel (role/user). */
  async search(keyword: string) {
    await this.searchInput.fill(keyword);
    await this.searchInput.press('Enter');
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  /** Hapus role jika sudah ada (biar test bisa di-repeat). Gagal jika role masih dipakai data lain. */
  async deleteRoleIfExists(code: string) {
    await this.search(code);
    const row = this.page.getByRole('row', { name: new RegExp(code) });
    if (await row.count()) {
      await row.getByRole('button', { name: 'Open menu' }).click();
      await this.page.getByRole('menuitem', { name: 'Hapus' }).click();
      await this.confirmDelete();
      await expect(this.page.getByRole('row', { name: new RegExp(code) })).toHaveCount(0, {
        timeout: 10000,
      });
    }
  }

  /** Hapus user jika sudah ada (biar test bisa di-repeat). */
  async deleteUserIfExists(email: string) {
    await this.search(email);
    const row = this.page.getByRole('row', { name: new RegExp(email) });
    if (await row.count()) {
      await row.getByRole('button', { name: 'Open menu' }).click();
      await this.page.getByRole('menuitem', { name: 'Hapus' }).click();
      await this.confirmDelete();
      await expect(this.page.getByRole('row', { name: new RegExp(email) })).toHaveCount(0, {
        timeout: 10000,
      });
    }
  }

  private async confirmDelete() {
    const confirm = this.page.getByRole('button', { name: /Lanjutkan|Ya|Konfirmasi|Delete|Hapus/i });
    if (await confirm.count()) {
      await confirm.first().click();
      await expect(this.page.locator('[role="alertdialog"]')).toHaveCount(0, { timeout: 10000 }).catch(() => {});
    }
  }
}
