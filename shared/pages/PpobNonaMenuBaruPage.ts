import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object - Halaman menu lanjutan BOT PPOB NONA yang TIDAK bisa di-goto langsung
 * (rute hanya valid saat dibuka lewat klik link sidebar, direct goto -> 404):
 *  - Transactions: Monitoring (`/transactions/monitoring`), Recapitulation (`/transactions/recap`)
 *  - Rekonsiliasi: Data Gateway (`/reconciliation/data-gateway`), BSI/BRI/BTN/Mandiri VA
 *  - Settlement: Payment Service Provider (`/settlement/payment-service-provider`), Biller (`/settlement/biller`)
 *
 * Scope test (sesuai arahan): tampil data saja, tanpa aksi tulis. Kecuali:
 *  - Monitoring: test search + filter dialog
 *  - Recap: test search + pilih tanggal
 *  - Data Gateway: test filter dialog saja
 *  - Rekon PSP: tampil data, boleh filter range tanggal via date picker
 *  - Settlement: tampil data, boleh buka halaman Tambah tanpa isi lalu batal
 *
 * Struktur yang sudah dipetakan lewat probe:
 *  - Sidebar link: `a[href="/transactions/monitoring"]` dst (klik, bukan goto)
 *  - Heading h1/h2 per halaman; semua halaman punya tombol "Filter" atau "Pilih Tanggal"
 *  - Monitoring: input search "Cari Customer Id...", dialog Filter (Status, Tanggal,
 *    Product, Reset/Terapkan), tabel kolom ID TRANSAKSI/CUSTOMER ID/PSP/PRODUK/STATUS...
 *  - Recap: input search "Cari Transaksi...", tombol "Pilih Tanggal", tabel rekap
 *  - Data Gateway: dialog Filter (Tanggal Rekonsiliasi, Status Rekonsiliasi), tabel TGL REKON/PRODUCT/STATUS/PROGRESS
 *  - Rekon PSP: chips Draft/Processing/Finalized/Cancelled, tombol "Pilih Tanggal Transaksi",
 *    tabel TRX DATE/APP TX/PSP TX/MISSING...
 *  - Settlement: tombol "Tambah" membuka halaman baru `.../create` (form step 1 Pilih Recon Header)
 */
export class PpobNonaMenuBaruPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Buka webview BOT PPOB NONA lewat portal lalu kembalikan page object. */
  static async open(portalPage: Page): Promise<PpobNonaMenuBaruPage> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await PpobNonaMenuBaruPage.openOnce(portalPage);
      } catch (err) {
        lastError = err as Error;
        await portalPage.waitForTimeout(3000);
      }
    }
    throw lastError;
  }

  private static async openOnce(portalPage: Page): Promise<PpobNonaMenuBaruPage> {
    await portalPage.goto('/');
    await portalPage.waitForLoadState('domcontentloaded');
    await portalPage.getByText('Pilih BOT Anda').waitFor({ state: 'visible', timeout: 15000 });
    const card = portalPage.locator('div.p-4.border.rounded-lg', { hasText: 'BOT PPOB NONA' }).first();
    await expect(card).toBeVisible({ timeout: 15000 });
    const popupPromise = portalPage.waitForEvent('popup', { timeout: 20000 });
    await card.getByRole('button', { name: 'Masuk' }).click();
    const webview = await popupPromise;
    await webview.waitForLoadState('domcontentloaded');
    await webview.waitForURL(/backoffice-ppob-nona-webview-playground\.lentera-app\.id\/?$/, {
      timeout: 30000,
    });
    await webview.waitForTimeout(1500);
    return new PpobNonaMenuBaruPage(webview);
  }

  /**
   * Buka halaman menu lewat klik link sidebar (bukan goto).
   * Menunggu heading target muncul sebagai tanda navigasi sukses.
   */
  async openViaSidebar(route: string, heading: string) {
    const link = this.page.locator(`a[href="${route}"]`).first();
    await expect(link).toBeVisible({ timeout: 15000 });
    await link.click();
    await this.page.waitForTimeout(1500);
    const h = this.page.getByRole('heading', { name: heading });
    await expect(h).toBeVisible({ timeout: 15000 });
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  // ---------- SHARED ----------

  heading(name: string): Locator {
    return this.page.getByRole('heading', { name });
  }

  table(): Locator {
    return this.page.locator('main table').first();
  }

  rowFor(keyword: string): Locator {
    return this.page.locator('main tbody tr', { hasText: keyword }).first();
  }

  async tableRows(): Promise<number> {
    return this.page.locator('main tbody tr').count();
  }

  /** Status chip rekon (Draft/Processing/Finalized/Cancelled + jumlah). */
  chip(name: string): Locator {
    return this.page.getByRole('button', { name: new RegExp(name) }).first();
  }

  /** Tombol "Filter" yang membuka dialog filter. */
  async openFilterDialog() {
    await this.page.getByRole('button', { name: 'Filter', exact: true }).first().click();
    await this.page.getByRole('dialog').waitFor({ state: 'visible', timeout: 10000 });
  }

  async clickTerapkan() {
    await this.page.getByRole('button', { name: 'Terapkan' }).first().click();
    await this.page.waitForTimeout(2000);
  }

  // ---------- MONITORING ----------

  monitoringHeading(): Locator {
    return this.heading('Monitoring Transaction');
  }

  async searchMonitoring(keyword: string) {
    const input = this.page.locator('main input[placeholder*="Cari Customer Id"]');
    await input.fill(keyword);
    await this.page.waitForTimeout(2000);
  }

  async openMonitoringFilter() {
    await this.openFilterDialog();
  }

  /** Pilih Status Payment di dialog filter (opsional: langsung klik Terapkan utk reset view). */
  async filterMonitoringStatus(status: 'Paid' | 'Failed' | 'Pending' | 'Created') {
    const dialog = this.page.getByRole('dialog');
    await dialog.getByRole('combobox').click();
    await this.page.getByRole('option', { name: status, exact: true }).click();
    await this.clickTerapkan();
  }

  // ---------- RECAP ----------

  recapHeading(): Locator {
    return this.heading('Rekap Transaksi');
  }

  async searchRecap(keyword: string) {
    const input = this.page.locator('main input[placeholder*="Cari Transaksi"]');
    await input.fill(keyword);
    await this.page.waitForTimeout(2000);
  }

  async openRecapDatePicker() {
    await this.page.getByRole('button', { name: 'Pilih Tanggal' }).first().click();
    await this.page.getByRole('dialog').waitFor({ state: 'visible', timeout: 10000 });
  }

  // ---------- DATA GATEWAY ----------

  dataGatewayHeading(): Locator {
    return this.heading('Data Gateway');
  }

  async openDataGatewayFilter() {
    await this.openFilterDialog();
  }

  async filterDataGatewayStatus(status: 'Draft' | 'Processing' | 'Finalized' | 'Cancelled') {
    const dialog = this.page.getByRole('dialog');
    await dialog.getByRole('combobox').click();
    await this.page.getByRole('option', { name: status, exact: true }).click();
    await this.clickTerapkan();
  }

  // ---------- REKON ----------

  rekonHeading(label: string): Locator {
    return this.heading(`Rekonsiliasi ${label}`);
  }

  async openRekonDatePicker() {
    await this.page.getByRole('button', { name: 'Pilih Tanggal Transaksi' }).first().click();
    await this.page.getByRole('dialog').waitFor({ state: 'visible', timeout: 10000 });
  }

  /** Klik preset tanggal ("Hari Ini"/"Kemarin"/"Bulan Ini") pada date picker. */
  async pickRekonPreset(preset: 'Hari Ini' | 'Kemarin' | 'Bulan Ini') {
    const dialog = this.page.getByRole('dialog');
    await dialog.getByRole('button', { name: preset, exact: true }).click();
    await this.page.waitForTimeout(2000);
  }

  // ---------- SETTLEMENT ----------

  settlementHeading(label: string): Locator {
    return this.heading(`Settlement ${label}`);
  }

  /** Buka halaman Tambah settlement (create). Jangan isi data -> lalu Batal. */
  async openSettlementCreate() {
    await this.page.getByRole('button', { name: 'Tambah', exact: true }).click();
    await this.page.waitForURL(/\/create$/, { timeout: 15000 });
    await this.page.waitForTimeout(1500);
  }

  async cancelCreate() {
    await this.page.getByRole('button', { name: 'Batal' }).click();
    await this.page.waitForTimeout(2000);
  }
}
