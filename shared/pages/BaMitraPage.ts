import { Page, Locator, expect } from '@playwright/test';
import { BaPage } from './BaPage';

/**
 * Page Object - Master Data Mitra pada webview BOT BA (Biller Aggregator).
 * Halaman dibuka lewat popup portal, lalu sidebar Master -> Mitra.
 *
 * Karakteristik menu Mitra (hasil probe):
 *  - Tambah = halaman penuh /mitra_internal/add ("Tambah Mitra") dengan
 *    section Data Mitra (code, tipe pembayaran select Settlement/Balance,
 *    switch status, name, email, phone, alamat) + Data PIC (picName, picEmail,
 *    picPhone). Simpan disabled sampai SEMUA field + tipe pembayaran terisi.
 *  - Menu baris: Detail/Ubah, Top Up, Riwayat, Product Pricing, Credential,
 *    Aktifkan/Nonaktifkan. TIDAK ADA HAPUS (finding BA-004).
 *  - Detail/Ubah -> halaman /mitra_internal/detail/<id> ("Detail Mitra") yang
 *    awalnya READ-ONLY; klik tombol "Edit" menjadikan field editable, lalu
 *    Simpan menyimpan tanpa pindah halaman.
 *  - Aktifkan/Nonaktifkan memakai konfirmasi role="alertdialog"
 *    ("Apakah Anda yakin ingin Mengaktifkan/Menonaktifkan mitra ini").
 *  - Duplikat kode -> tetap di halaman add + pesan "... sudah digunakan".
 *  - Pencarian list memakai scan teks tabel (pola sama dengan BaBankPage).
 */
export class BaMitraPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Buka webview BA lewat portal lalu arahkan ke halaman Mitra. */
  static async open(portalPage: Page): Promise<BaMitraPage> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await BaMitraPage.openOnce(portalPage);
      } catch (err) {
        lastError = err as Error;
        await portalPage.waitForTimeout(3000);
      }
    }
    throw lastError;
  }

  private static async openOnce(portalPage: Page): Promise<BaMitraPage> {
    const ba = await BaPage.open(portalPage);
    await ba.openMitra();
    return new BaMitraPage(ba.page);
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

  // ---------- TAMBAH ----------

  async openAddForm() {
    await this.page.getByRole('button', { name: 'Mitra', exact: true }).first().click();
    await this.page.waitForURL(/\/mitra_internal\/add$/, { timeout: 15000 });
    await expect(this.page.getByRole('heading', { name: 'Tambah Mitra' })).toBeVisible({ timeout: 10000 });
  }

  async fillDataMitra(data: { code?: string; name?: string; email?: string; phone?: string; alamat?: string }) {
    if (data.code !== undefined) await this.page.locator('input[name="code"]').fill(data.code);
    if (data.name !== undefined) await this.page.locator('input[name="name"]').fill(data.name);
    if (data.email !== undefined) await this.page.locator('input[name="email"]').fill(data.email);
    if (data.phone !== undefined) await this.page.locator('input[name="phone"]').fill(data.phone);
    if (data.alamat !== undefined) await this.page.locator('textarea[placeholder="Masukan Alamat"]').fill(data.alamat);
    await this.page.waitForTimeout(500);
  }

  async fillPic(data: { picName?: string; picEmail?: string; picPhone?: string }) {
    if (data.picName !== undefined) await this.page.locator('input[name="picName"]').fill(data.picName);
    if (data.picEmail !== undefined) await this.page.locator('input[name="picEmail"]').fill(data.picEmail);
    if (data.picPhone !== undefined) await this.page.locator('input[name="picPhone"]').fill(data.picPhone);
    await this.page.waitForTimeout(500);
  }

  /** Pilih Tipe Pembayaran (select Settlement/Balance; index 1 = Balance). */
  async selectTipePembayaran(index: number) {
    await this.page.locator('main select').first().selectOption({ index });
    await this.page.waitForTimeout(500);
  }

  saveButton(): Locator {
    return this.page.locator('main button[type="submit"]');
  }

  isSaveDisabled(): Promise<boolean> {
    return this.saveButton().isDisabled();
  }

  /** Klik Simpan. Sukses = kembali ke list; gagal = tetap di /add + pesan error. */
  async save() {
    await expect(this.saveButton()).toBeEnabled({ timeout: 10000 });
    await this.saveButton().click();
    await this.page.waitForTimeout(3500);
  }

  async cancel() {
    await this.page.getByRole('button', { name: 'Kembali' }).first().click();
    await this.page.waitForURL(/\/mitra_internal$/, { timeout: 15000 });
  }

  // ---------- DETAIL / UBAH ----------

  async openDetail(keyword: string) {
    const row = this.rowFor(keyword);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Detail/Ubah' }).click();
    await this.page.waitForURL(/\/mitra_internal\/detail\/\d+$/, { timeout: 15000 });
    await expect(this.page.getByRole('heading', { name: 'Detail Mitra' })).toBeVisible({ timeout: 10000 });
  }

  /** Di halaman Detail, klik tombol Edit agar field jadi editable. */
  async clickEdit() {
    await this.page.getByRole('button', { name: 'Edit', exact: true }).first().click();
    await this.page.waitForTimeout(1000);
    await expect(this.page.locator('input[name="name"]')).toBeEditable({ timeout: 10000 });
  }

  /** Ubah nama di halaman Detail (mode edit) lalu Simpan. */
  async editName(name: string) {
    await this.clickEdit();
    await this.page.locator('input[name="name"]').fill(name);
    await this.page.waitForTimeout(500);
    await this.saveButton().click();
    await this.page.waitForTimeout(3500);
  }

  // ---------- STATUS (Aktifkan/Nonaktifkan) ----------

  /**
   * Toggle status via menu baris (Aktifkan/Nonaktifkan) + konfirmasi.
   * Kembalikan teks menu yang dipakai ("Aktifkan" / "Nonaktifkan").
   */
  async toggleStatus(keyword: string): Promise<'Aktifkan' | 'Nonaktifkan'> {
    const row = this.rowFor(keyword);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    const item = this.page.getByRole('menuitem', { name: /Aktifkan|Nonaktifkan/ }).first();
    const label = ((await item.textContent()) ?? '').trim();
    await item.click();
    const confirm = this.page.locator('[role="alertdialog"]').first();
    await expect(confirm).toBeVisible({ timeout: 10000 });
    await confirm.getByRole('button', { name: 'Lanjutkan' }).click();
    await this.page.waitForTimeout(3000);
    return label.includes('Nonaktifkan') ? 'Nonaktifkan' : 'Aktifkan';
  }
}
