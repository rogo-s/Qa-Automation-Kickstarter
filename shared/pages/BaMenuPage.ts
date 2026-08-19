import { Page, Locator, expect } from '@playwright/test';
import { BaPage } from './BaPage';

/**
 * Page Object - Master Data Menu pada webview BOT BA (Biller Aggregator).
 * Halaman dibuka lewat popup portal, lalu sidebar Master -> Menu.
 *
 * Karakteristik menu (hasil probe):
 *  - Form tambah/ubah = dialog radix: title ("Masukan nama menu"), code, icon,
 *    Parent (picker combobox [role="option"]), Urutan (picker Default/1..N),
 *    Tipe (combobox "Pilih Aplikasi": Internal/Mitra), Daftar Aksi Kustom
 *    (opsional), description, switch status.
 *  - Simpan disabled sampai title + code + icon + parent + urutan + tipe +
 *    deskripsi terisi (aksi kustom opsional).
 *  - Default status menu baru = TIDAK AKTIF (switch unchecked).
 *  - HAPUS TIDAK BISA di playground: DELETE selalu 403 "Anda tidak memiliki
 *    izin untuk mengakses halaman atau action ini" (lihat finding BA-003).
 *    Akibatnya data QA memakai kode konstan & test add bersifat idempoten.
 *  - Pencarian list memakai scan teks tabel (pola sama dengan BaBankPage).
 */
export class BaMenuPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Buka webview BA lewat portal lalu arahkan ke halaman Menu. */
  static async open(portalPage: Page): Promise<BaMenuPage> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await BaMenuPage.openOnce(portalPage);
      } catch (err) {
        lastError = err as Error;
        await portalPage.waitForTimeout(3000);
      }
    }
    throw lastError;
  }

  private static async openOnce(portalPage: Page): Promise<BaMenuPage> {
    const ba = await BaPage.open(portalPage);
    await ba.openMenu();
    return new BaMenuPage(ba.page);
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

  // ---------- FORM (dialog Tambah / Ubah) ----------

  formDialog(): Locator {
    return this.page.locator('[role="dialog"]').first();
  }

  async openAddForm() {
    await this.page.getByRole('button', { name: 'Menu', exact: true }).first().click();
    await this.page.locator('input[name="title"]').waitFor({ state: 'visible', timeout: 10000 });
  }

  async openEditForm(keyword: string) {
    const row = this.rowFor(keyword);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Ubah' }).click();
    await this.page.locator('input[name="title"]').waitFor({ state: 'visible', timeout: 10000 });
  }

  async fillForm(data: { title?: string; code?: string; icon?: string; description?: string }) {
    if (data.title !== undefined) await this.page.locator('input[name="title"]').fill(data.title);
    if (data.code !== undefined) await this.page.locator('input[name="code"]').fill(data.code);
    if (data.icon !== undefined) await this.page.locator('input[name="icon"]').fill(data.icon);
    if (data.description !== undefined) await this.page.locator('textarea[name="description"]').fill(data.description);
    await this.page.waitForTimeout(500);
  }

  /** Klik picker pada label tertentu lalu pilih opsi exact. */
  private async pickFromLabel(label: string, option: string) {
    const field = this.formDialog()
      .locator('div.space-y-2')
      .filter({ has: this.page.locator('label', { hasText: label }) })
      .first();
    await field.locator('button').first().click();
    await this.page.waitForTimeout(1200);
    const picker = this.page.locator('[role="dialog"]').last();
    await picker.locator('[role="option"]').filter({ hasText: new RegExp(`^${option}$`) }).first().click();
    await this.page.waitForTimeout(1000);
  }

  /** Pilih Parent menu (mis. "Master"). */
  async selectParent(option: string) {
    await this.pickFromLabel('Parent', option);
  }

  /** Pilih Urutan (angka 1-13, atau "Default"). */
  async selectUrutan(option: string) {
    await this.pickFromLabel('Urutan', option);
  }

  /** Pilih Tipe (aplikasi) via combobox "Pilih Aplikasi" (Internal / Mitra). */
  async selectTipe(tipe: 'Internal' | 'Mitra') {
    await this.formDialog().locator('[role="combobox"]').first().click();
    await this.page.waitForTimeout(1000);
    await this.page.locator('[role="option"]:visible').filter({ hasText: tipe }).first().click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Tambah satu aksi kustom (wajib minimal 1 — tanpa aksi Simpan tetap disabled).
   * Isi input "Masukan nama aksi baru" lalu klik "Tambah Aksi".
   */
  async addCustomAction(name: string) {
    await this.formDialog().locator('input[placeholder="Masukan nama aksi baru"]').fill(name);
    await this.page.waitForTimeout(400);
    await this.formDialog().getByRole('button', { name: 'Tambah Aksi' }).click();
    await this.page.waitForTimeout(800);
  }

  /** Set status aktif/nonaktif lewat switch pada dialog form. */
  async setStatus(wantActive: boolean) {
    const sw = this.formDialog().locator('button[role="switch"]').first();
    const want = wantActive ? 'checked' : 'unchecked';
    if ((await sw.getAttribute('data-state')) !== want) {
      await sw.click();
      await this.page.waitForTimeout(500);
    }
  }

  isSaveDisabled(): Promise<boolean> {
    return this.formDialog().locator('button[type="submit"]').isDisabled();
  }

  /** Klik Simpan. Sukses = dialog tertutup; gagal (mis. duplikat) = dialog tetap. */
  async save() {
    await expect(this.formDialog().locator('button[type="submit"]')).toBeEnabled({ timeout: 10000 });
    await this.formDialog().locator('button[type="submit"]').click();
    await this.page.waitForTimeout(2500);
  }

  /** Tutup dialog form (tombol Close). */
  async closeForm() {
    await this.formDialog().locator('button').last().click();
    await this.page.waitForTimeout(1200);
  }

  // ---------- DELETE (selalu 403 di playground, lihat BA-003) ----------

  async deleteMenu(keyword: string) {
    const row = this.rowFor(keyword);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Hapus' }).click();
    const confirm = this.page.locator('[role="alertdialog"]').first();
    await expect(confirm).toBeVisible({ timeout: 10000 });
    await confirm.getByRole('button', { name: 'Lanjutkan' }).click();
    await this.page.waitForTimeout(3000);
  }
}
