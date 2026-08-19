import { Page, Locator, expect } from '@playwright/test';
import { BaPage } from './BaPage';

/**
 * Page Object - Master Data Manage Role pada webview BOT BA (Biller Aggregator).
 * Halaman dibuka lewat popup portal, lalu sidebar Master -> Manage Role.
 *
 * Karakteristik menu Role (hasil probe):
 *  - Tambah = halaman penuh /manage_role_internal/add (bukan dialog):
 *    input[name="name"], combobox "Pilih Aplikasi" (opsi Internal/Mitra),
 *    select[name="app"] "Pilih Tipe" (Internal/Mitra), textarea[name="description"],
 *    dan matriks permission per modul (radix checkbox button[role="checkbox"]).
 *  - Simpan disabled sampai nama + aplikasi + tipe + deskripsi terisi.
 *  - API menolak simpan tanpa permission: 400 "Role minimal memiliki satu
 *    akses menu dan action" (pesan tampil di halaman).
 *  - Sukses simpan -> kembali ke halaman list (POST/PUT .../role/add|edit 200).
 *  - Edit = halaman /manage_role_internal/edit/<id> (row menu -> Ubah).
 *  - Hapus = konfirmasi role="alertdialog" "Apakah Anda yakin ingin menghapus
 *    role ini?" -> tombol Batal / Lanjutkan.
 *  - Pencarian list memakai scan teks tabel (pola sama dengan BaBankPage).
 */
export class BaRolePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Buka webview BA lewat portal lalu arahkan ke halaman Role. */
  static async open(portalPage: Page): Promise<BaRolePage> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await BaRolePage.openOnce(portalPage);
      } catch (err) {
        lastError = err as Error;
        await portalPage.waitForTimeout(3000);
      }
    }
    throw lastError;
  }

  private static async openOnce(portalPage: Page): Promise<BaRolePage> {
    const ba = await BaPage.open(portalPage);
    await ba.openRole();
    return new BaRolePage(ba.page);
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

  // ---------- FORM TAMBAH ----------

  async openAddForm() {
    await this.page.getByRole('button', { name: 'Role', exact: true }).first().click();
    await this.page.waitForURL(/\/manage_role_internal\/add$/, { timeout: 15000 });
    await expect(this.page.getByRole('heading', { name: 'Tambah Role' })).toBeVisible({ timeout: 10000 });
  }

  async openEditForm(name: string) {
    const row = this.rowFor(name);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Ubah' }).click();
    await this.page.waitForURL(/\/manage_role_internal\/edit\/\d+$/, { timeout: 15000 });
    await expect(this.page.getByRole('heading', { name: 'Ubah Role' })).toBeVisible({ timeout: 10000 });
  }

  async fillName(name: string) {
    await this.page.locator('input[name="name"]').fill(name);
    await this.page.waitForTimeout(500);
  }

  /** Pilih Aplikasi via combobox (opsi Internal / Mitra). */
  async selectApp(app: 'Internal' | 'Mitra') {
    await this.page.locator('main button[role="combobox"]').first().click();
    await this.page.waitForTimeout(800);
    await this.page.getByRole('option', { name: app, exact: true }).click();
    await this.page.waitForTimeout(800);
  }

  /** Pilih Tipe via select[name="app"] (opsi Internal / Mitra). */
  async selectTipe(tipe: 'Internal' | 'Mitra') {
    await this.page.locator('main select[name="app"]').selectOption({ label: tipe });
    await this.page.waitForTimeout(500);
  }

  async fillDescription(description: string) {
    await this.page.locator('textarea[name="description"]').fill(description);
    await this.page.waitForTimeout(500);
  }

  /** Centang aksi (mis. Export/View) pada modul tertentu bila belum dicentang. */
  async checkAction(moduleLabel: string, actionLabel: string) {
    const module = this.page
      .locator('main div.space-y-2')
      .filter({ has: this.page.locator('label.font-bold', { hasText: moduleLabel }) })
      .first();
    const actionRow = module.locator('div.flex', { hasText: actionLabel }).first();
    const cb = actionRow.locator('button[role="checkbox"]').first();
    if ((await cb.getAttribute('data-state')) !== 'checked') {
      await cb.click();
      await this.page.waitForTimeout(500);
    }
  }

  /** Centang permission Dashboard: Export + View (minimum valid utk simpan). */
  async grantDashboardPermissions() {
    await this.checkAction('Dashboard', 'Export');
    await this.checkAction('Dashboard', 'View');
  }

  saveButton(): Locator {
    return this.page.locator('main button[type="submit"]');
  }

  isSaveDisabled(): Promise<boolean> {
    return this.saveButton().isDisabled();
  }

  /** Klik Simpan lalu tunggu kembali ke halaman list. */
  async save() {
    await expect(this.saveButton()).toBeEnabled({ timeout: 10000 });
    await this.saveButton().click();
    await this.page.waitForURL(/\/manage_role_internal$/, { timeout: 15000 });
    await expect(this.page.getByRole('heading', { name: 'Role', exact: true })).toBeVisible({ timeout: 10000 });
  }

  async cancel() {
    await this.page.getByRole('button', { name: 'Kembali' }).first().click();
    await this.page.waitForURL(/\/manage_role_internal$/, { timeout: 15000 });
  }

  // ---------- DELETE ----------

  async deleteRole(name: string) {
    const row = this.rowFor(name);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Hapus' }).click();
    const confirm = this.page.locator('[role="alertdialog"]').first();
    await expect(confirm).toBeVisible({ timeout: 10000 });
    await confirm.getByRole('button', { name: 'Lanjutkan' }).click();
    await this.page.waitForTimeout(3000);
  }
}
