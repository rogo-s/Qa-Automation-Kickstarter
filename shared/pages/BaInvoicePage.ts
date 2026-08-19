import { Page, Locator, expect } from '@playwright/test';
import { BaPage } from './BaPage';

/**
 * Page Object - Invoice pada webview BOT BA (Biller Aggregator).
 * Halaman dibuka lewat popup portal, lalu sidebar Invoice.
 *
 * Karakteristik menu Invoice (hasil probe):
 *  - Baris "Lunas" TIDAK punya row menu; hanya "Belum Lunas" yang punya
 *    menu: Konfirmasi Pembayaran & Print/Cetak.
 *  - Generate = dialog "Melakukan generate": Tanggal Awal & Tanggal Akhir
 *    (kalender popover, TANPA preset — klik hari div[role="button"][data-value]),
 *    Mitra (multi-select popover), tombol Generate disabled sampai lengkap.
 *  - Generate sukses -> dialog tertutup + invoice baru di baris teratas
 *    (periode dihitung server, status "Belum Lunas").
 *  - Konfirmasi Pembayaran = alertdialog "Apakah Anda yakin ingin melunaskan
 *    invoice ini?" -> Batal / Lanjutkan. Setelah Lanjutkan status jadi "Lunas".
 *  - Print/Cetak tidak membuka dialog/popup/download (window.print di headless).
 */
export class BaInvoicePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Buka webview BA lewat portal lalu arahkan ke halaman Invoice. */
  static async open(portalPage: Page): Promise<BaInvoicePage> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await BaInvoicePage.openOnce(portalPage);
      } catch (err) {
        lastError = err as Error;
        await portalPage.waitForTimeout(3000);
      }
    }
    throw lastError;
  }

  private static async openOnce(portalPage: Page): Promise<BaInvoicePage> {
    const ba = await BaPage.open(portalPage);
    await ba.openInvoice();
    return new BaInvoicePage(ba.page);
  }

  // ---------- LIST ----------

  async tableText(): Promise<string> {
    return ((await this.page.locator('main tbody').textContent()) ?? '').trim().replace(/\s+/g, ' ');
  }

  rowFor(keyword: string): Locator {
    return this.page.locator('main tbody tr', { hasText: keyword }).first();
  }

  firstRowText(): Promise<string> {
    return this.page.locator('main tbody tr').first().textContent().then((t) => (t ?? '').trim().replace(/\s+/g, ' '));
  }

  // ---------- GENERATE ----------

  generateDialog(): Locator {
    return this.page
      .locator('[role="dialog"]')
      .filter({ has: this.page.locator('h2', { hasText: 'Melakukan generate' }) })
      .first();
  }

  async openGenerateDialog() {
    await this.page.getByRole('button', { name: 'Generate', exact: true }).first().click();
    await expect(this.generateDialog()).toBeVisible({ timeout: 10000 });
  }

  /** Pilih mitra di dialog generate (multi-select popover; cocokkan keyword). */
  async selectMitra(keyword: string) {
    await this.generateDialog().getByRole('button', { name: 'Mitra' }).first().click();
    await this.page.waitForTimeout(1200);
    await this.page.locator('[role="option"]:visible').filter({ hasText: keyword }).first().click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Pilih tanggal awal/akhir via kalender popover (klik hari data-value).
   * setKedua=true untuk field kedua: tombol "Pilih Tanggal" yang tersisa.
   */
  async pickDate(dayValue: string, kedua = false) {
    const btns = this.generateDialog().locator('button').filter({ hasText: 'Pilih Tanggal' });
    await btns.first().click();
    await this.page.waitForTimeout(1200);
    const day = this.page.locator(`div[role="button"][data-value="${dayValue}"]`).last();
    await expect(day).toBeVisible({ timeout: 10000 });
    await day.click();
    await this.page.waitForTimeout(1200);
  }

  isGenerateDisabled(): Promise<boolean> {
    return this.generateDialog().locator('button[type="submit"]').isDisabled();
  }

  /** Klik Generate; sukses = dialog tertutup. */
  async generate() {
    await expect(this.generateDialog().locator('button[type="submit"]')).toBeEnabled({ timeout: 10000 });
    await this.generateDialog().locator('button[type="submit"]').click();
    await expect(this.generateDialog()).toHaveCount(0, { timeout: 15000 });
    await this.page.waitForTimeout(2000);
  }

  async closeGenerate() {
    await this.generateDialog().locator('button').last().click();
    await this.page.waitForTimeout(1200);
  }

  // ---------- ROW ACTION ----------

  /** Buka menu baris invoice (keyword = nomor invoice atau teks unik baris). */
  async openRowMenu(keyword: string) {
    const row = this.rowFor(keyword);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.locator('button', { hasText: 'Open menu' }).first().click();
    await this.page.waitForTimeout(800);
  }

  async openKonfirmasiPembayaran(keyword: string) {
    await this.openRowMenu(keyword);
    await this.page.getByRole('menuitem', { name: 'Konfirmasi Pembayaran' }).click();
    await expect(this.page.locator('[role="alertdialog"]').first()).toBeVisible({ timeout: 10000 });
  }

  async confirmLunas() {
    const ad = this.page.locator('[role="alertdialog"]').first();
    await ad.getByRole('button', { name: 'Lanjutkan' }).click();
    await this.page.waitForTimeout(3000);
  }

  async cancelAlert() {
    await this.page.locator('[role="alertdialog"]').first().getByRole('button', { name: 'Batal' }).click();
    await this.page.waitForTimeout(1200);
  }

  async printInvoice(keyword: string) {
    await this.openRowMenu(keyword);
    await this.page.getByRole('menuitem', { name: 'Print/Cetak' }).click();
    await this.page.waitForTimeout(2000);
  }
}
