import { Page, Locator, expect } from '@playwright/test';
import { BaPage } from './BaPage';

/**
 * Page Object - Master Data Kategori dan Grup pada webview BOT BA.
 * Halaman dibuka lewat popup portal, lalu sidebar Master -> Kategori Dan Grup.
 *
 * Karakteristik menu (hasil probe):
 *  - Dua tab: Kategori & Grup (button.inline-block), struktur keduanya identik.
 *  - Tombol tambah berlabel sama dengan tab aktif ("Kategori"/"Grup") dan
 *    selalu jadi button PERTAMA yang match teks tsb (tab ada di urutan kedua).
 *  - Form tambah/ubah = dialog radix: input name ("Masukan nama"),
 *    code ("Masukan kode"), textarea description ("Masukan deskripsi"),
 *    dan switch status (button[role="switch"]; default unchecked -> "Tidak Aktif").
 *  - Simpan disabled sampai nama + kode + deskripsi terisi.
 *  - Duplikat kode -> dialog tetap terbuka + pesan "... sudah digunakan" di halaman.
 *  - Hapus = konfirmasi role="alertdialog" -> tombol Batal / Lanjutkan.
 *  - Pencarian list memakai scan teks tabel (pola sama dengan BaBankPage).
 */
export class BaCategoryGroupPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Buka webview BA lewat portal lalu arahkan ke halaman Kategori dan Grup. */
  static async open(portalPage: Page): Promise<BaCategoryGroupPage> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await BaCategoryGroupPage.openOnce(portalPage);
      } catch (err) {
        lastError = err as Error;
        await portalPage.waitForTimeout(3000);
      }
    }
    throw lastError;
  }

  private static async openOnce(portalPage: Page): Promise<BaCategoryGroupPage> {
    const ba = await BaPage.open(portalPage);
    await ba.openCategoryGroup();
    return new BaCategoryGroupPage(ba.page);
  }

  // ---------- TAB ----------

  async openTab(tab: 'Kategori' | 'Grup') {
    await this.page.locator('main button.inline-block').filter({ hasText: tab }).first().click();
    await this.page.waitForTimeout(1200);
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

  /** Buka tab lalu klik tombol tambah (button pertama berlabel sama dgn tab). */
  async openAddForm(tab: 'Kategori' | 'Grup') {
    await this.openTab(tab);
    await this.page.locator('main button').filter({ hasText: tab }).first().click();
    await this.page.locator('input[name="name"]').waitFor({ state: 'visible', timeout: 10000 });
  }

  async openEditForm(keyword: string) {
    const row = this.rowFor(keyword);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Ubah' }).click();
    await this.page.locator('input[name="name"]').waitFor({ state: 'visible', timeout: 10000 });
  }

  async fillForm(data: { name?: string; code?: string; description?: string }) {
    if (data.name !== undefined) await this.page.locator('input[name="name"]').fill(data.name);
    if (data.code !== undefined) await this.page.locator('input[name="code"]').fill(data.code);
    if (data.description !== undefined) await this.page.locator('textarea[name="description"]').fill(data.description);
    await this.page.waitForTimeout(500);
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

  /** Klik Simpan. Sukses = dialog tertutup; gagal = dialog tetap + pesan error. */
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

  // ---------- DELETE ----------

  async deleteData(keyword: string) {
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
