import { Page, Locator, expect } from '@playwright/test';
import { BaPage } from './BaPage';

/**
 * Page Object - Master Data Topup Bank Account pada webview BOT BA.
 * Halaman dibuka lewat popup portal, lalu sidebar Master -> Topup Bank Account.
 *
 * Karakteristik menu (hasil probe):
 *  - Form tambah/ubah = dialog radix ("Tambah Rekening Topup" /
 *    "Edit Rekening Topup"): input accountName, accountNumber, description,
 *    dan picker Bank (tombol "Pilih bank" -> daftar [role="option"]).
 *  - Simpan disabled sampai nama akun + nomor rekening + deskripsi + bank terisi.
 *  - Duplikat nomor rekening -> dialog tetap + pesan "Nomor rekening sudah digunakan".
 *  - Hapus = konfirmasi role="alertdialog" -> tombol Batal / Lanjutkan.
 *    (teks menyebut "provider", lihat finding BA-002).
 *  - Pencarian list memakai scan teks tabel (pola sama dengan BaBankPage).
 */
export class BaTopupBankAccountPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Buka webview BA lewat portal lalu arahkan ke halaman Topup Bank Account. */
  static async open(portalPage: Page): Promise<BaTopupBankAccountPage> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await BaTopupBankAccountPage.openOnce(portalPage);
      } catch (err) {
        lastError = err as Error;
        await portalPage.waitForTimeout(3000);
      }
    }
    throw lastError;
  }

  private static async openOnce(portalPage: Page): Promise<BaTopupBankAccountPage> {
    const ba = await BaPage.open(portalPage);
    await ba.openTopupBankAccount();
    return new BaTopupBankAccountPage(ba.page);
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
    await this.page.getByRole('button', { name: 'Topup Bank Account', exact: true }).first().click();
    await this.page.locator('input[name="accountName"]').waitFor({ state: 'visible', timeout: 10000 });
  }

  async openEditForm(keyword: string) {
    const row = this.rowFor(keyword);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Ubah' }).click();
    await this.page.locator('input[name="accountName"]').waitFor({ state: 'visible', timeout: 10000 });
  }

  async fillForm(data: { accountName?: string; accountNumber?: string; description?: string }) {
    if (data.accountName !== undefined) await this.page.locator('input[name="accountName"]').fill(data.accountName);
    if (data.accountNumber !== undefined) await this.page.locator('input[name="accountNumber"]').fill(data.accountNumber);
    if (data.description !== undefined) await this.page.locator('input[name="description"]').fill(data.description);
    await this.page.waitForTimeout(500);
  }

  /** Pilih Bank lewat picker (tombol "Pilih bank" -> opsi nama bank). */
  async selectBank(bankKeyword: string) {
    await this.formDialog().getByRole('button', { name: /Pilih bank/ }).first().click();
    await this.page.waitForTimeout(1200);
    const picker = this.page.locator('[role="dialog"]').last();
    await picker.locator('[role="option"]').filter({ hasText: bankKeyword }).first().click();
    await this.page.waitForTimeout(1000);
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
