import { Page, Locator, expect } from '@playwright/test';
import { BaPage } from './BaPage';

/**
 * Page Object - Master Data Manage User pada webview BOT BA.
 * Halaman dibuka lewat popup portal, lalu sidebar Master -> Manage User.
 *
 * Karakteristik menu User (hasil probe):
 *  - Dua tab: Internal & Mitra. Tambah user internal -> halaman penuh
 *    /manage_user_internal/add/internal ("Tambah User Internal").
 *  - Field: fullName, email (READONLY -> isi via click + keyboard.type),
 *    phone, password (READONLY -> keyboard.type), maxLoginSession (opsional),
 *    Role (combobox "Pilih role"), Status switch (default checked = Aktif).
 *  - Simpan disabled sampai nama + email + phone + password + role terisi.
 *  - Sukses simpan -> kembali ke list ?type=internal.
 *  - Menu baris: Ubah & Detail SAJA (TIDAK ADA HAPUS).
 *  - Ubah -> /edit-internal/<id>; Detail -> /detail-internal/<id>.
 *  - Pencarian list memakai scan teks tabel (pola sama dengan BaBankPage).
 */
export class BaUserPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Buka webview BA lewat portal lalu arahkan ke halaman List User. */
  static async open(portalPage: Page): Promise<BaUserPage> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await BaUserPage.openOnce(portalPage);
      } catch (err) {
        lastError = err as Error;
        await portalPage.waitForTimeout(3000);
      }
    }
    throw lastError;
  }

  private static async openOnce(portalPage: Page): Promise<BaUserPage> {
    const ba = await BaPage.open(portalPage);
    await ba.openUser();
    return new BaUserPage(ba.page);
  }

  // ---------- LIST ----------

  /** Cek data ada/tidak dengan scan teks tabel (semua baris tampil). */
  async hasRow(keyword: string): Promise<boolean> {
    await this.page.waitForTimeout(1000);
    const text = await this.page.locator('main tbody').textContent().catch(() => '');
    return !!text && text.includes(keyword);
  }

  rowFor(keyword: string): Locator {
    return this.page.locator('main tbody tr', { hasText: keyword }).first();
  }

  async openTab(tab: 'Internal' | 'Mitra') {
    await this.page.getByRole('button', { name: tab, exact: true }).first().click();
    await this.page.waitForTimeout(1500);
  }

  // ---------- TAMBAH ----------

  async openAddForm() {
    await this.page.getByRole('button', { name: 'User', exact: true }).first().click();
    await this.page.waitForURL(/\/manage_user_internal\/add\/internal$/, { timeout: 15000 });
    await expect(this.page.getByRole('heading', { name: 'Tambah User Internal' })).toBeVisible({ timeout: 10000 });
  }

  /** Tab Mitra: buka tab lalu klik tambah User -> halaman add/mitra. */
  async openAddFormMitra() {
    await this.openTab('Mitra');
    await this.page.getByRole('button', { name: 'User', exact: true }).first().click();
    await this.page.waitForURL(/\/manage_user_internal\/add\/mitra$/, { timeout: 15000 });
    await expect(this.page.getByRole('heading', { name: 'Tambah User Mitra' })).toBeVisible({ timeout: 10000 });
  }

  /** Email & password readonly -> isi via click + keyboard.type. */
  async fillForm(data: { fullName?: string; username?: string; email?: string; phone?: string; password?: string }) {
    if (data.fullName !== undefined) await this.page.locator('input[name="fullName"]').fill(data.fullName);
    if (data.username !== undefined) await this.page.locator('input[name="username"]').fill(data.username);
    if (data.email !== undefined) {
      const input = this.page.locator('input[name="email"]');
      await input.click();
      await this.page.keyboard.type(data.email, { delay: 30 });
    }
    if (data.phone !== undefined) await this.page.locator('input[name="phone"]').fill(data.phone);
    if (data.password !== undefined) {
      const input = this.page.locator('input[name="password"]');
      await input.click();
      await this.page.keyboard.type(data.password, { delay: 30 });
    }
    await this.page.waitForTimeout(500);
  }

  /** Pilih role via combobox "Pilih role". */
  async selectRole(roleName: string) {
    await this.page.locator('main button').filter({ hasText: 'Pilih role' }).first().click();
    await this.page.waitForTimeout(1200);
    await this.page.locator('[role="option"]:visible').filter({ hasText: roleName }).first().click();
    await this.page.waitForTimeout(1000);
  }

  /** Pilih mitra (form User Mitra) via picker "Pilih mitra". */
  async selectMitra(keyword: string) {
    await this.page.locator('main button').filter({ hasText: 'Pilih mitra' }).first().click();
    await this.page.waitForTimeout(1200);
    await this.page.locator('[role="option"]:visible').filter({ hasText: keyword }).first().click();
    await this.page.waitForTimeout(1000);
  }

  /** Set status aktif/nonaktif lewat switch pada form. */
  async setStatus(wantActive: boolean) {
    const sw = this.page.locator('main button[role="switch"], main [role="switch"]').first();
    const want = wantActive ? 'checked' : 'unchecked';
    if ((await sw.getAttribute('data-state')) !== want) {
      await sw.click();
      await this.page.waitForTimeout(500);
    }
  }

  saveButton(): Locator {
    return this.page.locator('main button[type="submit"]');
  }

  isSaveDisabled(): Promise<boolean> {
    return this.saveButton().isDisabled();
  }

  /** Klik Simpan. Sukses = kembali ke list; gagal = tetap di form + pesan error. */
  async save() {
    await expect(this.saveButton()).toBeEnabled({ timeout: 10000 });
    await this.saveButton().click();
    await this.page.waitForTimeout(4000);
  }

  async cancel() {
    await this.page.getByRole('button', { name: 'Kembali' }).first().click();
    await this.page.waitForURL(/\/manage_user_internal/, { timeout: 15000 });
  }

  // ---------- UBAH / DETAIL ----------

  async openEditForm(keyword: string) {
    const row = this.rowFor(keyword);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Ubah' }).click();
    await this.page.waitForURL(/\/manage_user_internal\/edit-internal\/\d+$/, { timeout: 15000 });
    await expect(this.page.getByRole('heading', { name: /Ubah User|Edit User/ })).toBeVisible({ timeout: 10000 });
  }

  /** Ubah user tab Mitra (route edit-mitra). */
  async openEditFormMitra(keyword: string) {
    const row = this.rowFor(keyword);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Ubah' }).click();
    await this.page.waitForURL(/\/manage_user_internal\/edit-mitra\/\d+$/, { timeout: 15000 });
    await expect(this.page.getByRole('heading', { name: /Ubah User|Edit User/ })).toBeVisible({ timeout: 10000 });
  }

  async openDetail(keyword: string) {
    const row = this.rowFor(keyword);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Detail' }).click();
    await this.page.waitForURL(/\/manage_user_internal\/detail-internal\/\d+$/, { timeout: 15000 });
    await expect(this.page.getByRole('heading', { name: 'Detail User Internal' })).toBeVisible({ timeout: 10000 });
  }
}
