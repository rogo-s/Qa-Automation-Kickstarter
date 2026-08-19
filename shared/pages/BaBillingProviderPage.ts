import { Page, Locator, expect } from '@playwright/test';
import { BaPage } from './BaPage';

/**
 * Page Object - Master Data Billing Provider pada webview BOT BA.
 * Halaman dibuka lewat popup portal, lalu sidebar Master -> Billing Provider.
 *
 * Karakteristik menu (hasil probe):
 *  - Form tambah/ubah = dialog radix ("Tambah Provider"/"Edit Provider"):
 *    input name ("Masukan nama"), code ("Masukan kode"), route ("Masukan
 *    route"), dan switch status (default unchecked -> "Tidak Aktif").
 *  - Simpan disabled sampai nama + kode + route terisi.
 *  - Duplikat kode -> dialog tetap terbuka + pesan "... sudah digunakan".
 *  - Menu baris: Ubah / Hapus / Product.
 *  - Hapus = konfirmasi role="alertdialog" "Apakah Anda yakin ingin
 *    menghapus provider ini?" (teks BENAR di menu ini) -> Batal / Lanjutkan.
 *  - Pencarian list memakai scan teks tabel (pola sama dengan BaBankPage).
 */
export class BaBillingProviderPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Buka webview BA lewat portal lalu arahkan ke halaman Billing Provider. */
  static async open(portalPage: Page): Promise<BaBillingProviderPage> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await BaBillingProviderPage.openOnce(portalPage);
      } catch (err) {
        lastError = err as Error;
        await portalPage.waitForTimeout(3000);
      }
    }
    throw lastError;
  }

  private static async openOnce(portalPage: Page): Promise<BaBillingProviderPage> {
    const ba = await BaPage.open(portalPage);
    await ba.openBillingProviders();
    return new BaBillingProviderPage(ba.page);
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
    await this.page.getByRole('button', { name: 'Provider', exact: true }).first().click();
    await this.page.locator('input[name="name"]').waitFor({ state: 'visible', timeout: 10000 });
  }

  async openEditForm(keyword: string) {
    const row = this.rowFor(keyword);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Ubah' }).click();
    await this.page.locator('input[name="name"]').waitFor({ state: 'visible', timeout: 10000 });
  }

  async fillForm(data: { name?: string; code?: string; route?: string }) {
    if (data.name !== undefined) await this.page.locator('input[name="name"]').fill(data.name);
    if (data.code !== undefined) await this.page.locator('input[name="code"]').fill(data.code);
    if (data.route !== undefined) await this.page.locator('input[name="route"]').fill(data.route);
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
