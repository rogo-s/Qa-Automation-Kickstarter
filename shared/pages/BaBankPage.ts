import { Page, Locator, expect } from '@playwright/test';
import { BaPage } from './BaPage';

/**
 * Page Object - Master Data Bank pada webview BOT BA (Biller Aggregator).
 * Halaman dibuka lewat popup portal, lalu sidebar Master -> Bank.
 *
 * Karakteristik menu Bank (hasil probe):
 *  - Form Tambah/Ubah = dialog "Tambah Bank" / "Ubah Bank" (radix dialog):
 *    field input[name="code"] ("Masukkan kode") + input[name="name"] ("Masukkan nama bank").
 *    Simpan disabled sampai KEDUA field terisi.
 *  - Simpan gagal (mis. kode duplikat) -> dialog tetap terbuka + toast
 *    "Upss terjadi kesalahan: Kode sudah digunakan".
 *  - Baris tabel punya menu "Open menu" -> menuitem Ubah / Hapus.
 *  - Hapus memakai KONFIRMASI role="alertdialog" ("Apakah Anda yakin ingin
 *    menghapus provider ini?") dengan tombol Batal / Lanjutkan.
 *  - BUG PLAYGROUND: kolom pencarian selalu menghasilkan "Tidak ada data"
 *    untuk query apa pun. Karena itu "cek data ada/tidak" dilakukan dengan
 *    scan teks tabel (search dikosongkan agar semua baris tampil).
 */
export class BaBankPage {
  readonly page: Page;
  readonly bankHeading: Locator;
  readonly addBankButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.bankHeading = page.getByRole('heading', { name: 'Bank', exact: true });
    this.addBankButton = page.getByRole('button', { name: 'Bank', exact: true }).first();
  }

  /** Buka webview BA lewat portal lalu arahkan ke halaman Bank. */
  static async open(portalPage: Page): Promise<BaBankPage> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await BaBankPage.openOnce(portalPage);
      } catch (err) {
        lastError = err as Error;
        await portalPage.waitForTimeout(3000);
      }
    }
    throw lastError;
  }

  private static async openOnce(portalPage: Page): Promise<BaBankPage> {
    const ba = await BaPage.open(portalPage);
    await ba.openBank();
    return new BaBankPage(ba.page);
  }

  // ---------- SEARCH (cek data) ----------

  private searchInput(): Locator {
    return this.page.locator('main input[placeholder="Cari Bank..."]');
  }

  /**
   * Isi kolom pencarian lalu kembalikan ke kosong (bug playground: search
   * selalu "Tidak ada data", jadi pencarian dipakai hanya sebagai trigger).
   */
  async search(keyword: string) {
    await this.searchInput().fill(keyword);
    await this.page.waitForTimeout(1200);
    await this.searchInput().fill('');
    await this.page.waitForTimeout(1200);
  }

  /** Cek data ada/tidak dengan scan teks tabel (semua baris tampil). */
  async hasRow(keyword: string): Promise<boolean> {
    await this.search(keyword);
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

  async openAddBankForm() {
    await this.addBankButton.click();
    await this.page.locator('input[name="code"]').waitFor({ state: 'visible', timeout: 10000 });
  }

  async openEditBankForm(keyword: string) {
    const row = this.rowFor(keyword);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Ubah' }).click();
    await this.page.locator('input[name="code"]').waitFor({ state: 'visible', timeout: 10000 });
  }

  async fillForm(data: { code?: string; name?: string }) {
    if (data.code !== undefined) await this.page.locator('input[name="code"]').fill(data.code);
    if (data.name !== undefined) await this.page.locator('input[name="name"]').fill(data.name);
    await this.page.waitForTimeout(500);
  }

  isSaveDisabled(): Promise<boolean> {
    return this.formDialog().locator('button[type="submit"]').isDisabled();
  }

  /** Klik Simpan. Sukses = dialog tertutup; gagal = dialog tetap + toast error. */
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

  async deleteBank(keyword: string) {
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
