import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object - Master Data Denom pada webview BOT PPOB NONA.
 * Halaman dibuka lewat popup (klik "Masuk" BOT PPOB NONA di portal).
 *
 * Karakteristik halaman Denom:
 *  - Tidak ada kolom pencarian; gunakan dialog Filter (chip Status & Kode Produk).
 *  - Tabel diurutkan ascending by nominal (denom).
 *  - Form Tambah: input `denom` (numerik), combobox produk, switch Status,
 *    tombol Simpan disabled selama form tidak valid (denom bukan angka / produk kosong).
 *  - Form Ubah: hanya input `denom` + switch Status (produk tidak bisa diganti).
 *  - Baris menu: Ubah & Hapus (Hapus ada konfirmasi).
 */
const WEBVIEW = 'https://backoffice-ppob-nona-webview-playground.lentera-app.id';

export class PpobNonaDenomPage {
  readonly page: Page;
  readonly denomHeading: Locator;
  readonly addDenomButton: Locator;
  readonly filterButton: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.denomHeading = page.getByRole('heading', { name: 'Master Denom' });
    this.addDenomButton = page.getByRole('button', { name: 'Tambah Denom' });
    this.filterButton = page.getByRole('button', { name: 'Filter' }).first();
    this.saveButton = page.getByRole('dialog').getByRole('button', { name: 'Simpan' });
  }

  /** Buka webview BOT PPOB NONA lalu arahkan ke halaman Master Denom. */
  static async open(portalPage: Page): Promise<PpobNonaDenomPage> {
    let lastError: Error | undefined;
    // Popup webview kadang tidak terbuka dari klik pertama; retry aman karena
    // login portal adalah session yang sama (storageState .auth/portal.json).
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await PpobNonaDenomPage.openOnce(portalPage);
      } catch (err) {
        lastError = err as Error;
        await portalPage.waitForTimeout(3000);
      }
    }
    throw lastError;
  }

  private static async openOnce(portalPage: Page): Promise<PpobNonaDenomPage> {
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
    const denom = new PpobNonaDenomPage(webview);
    await denom.openDenomPage();
    return denom;
  }

  async openDenomPage() {
    await this.page.goto(WEBVIEW + '/master/denom');
    await expect(this.denomHeading).toBeVisible({ timeout: 15000 });
    await expect(this.addDenomButton).toBeVisible({ timeout: 15000 });
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  // ---------- FORM (Tambah / Ubah) ----------

  private dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  async openAddDenomForm() {
    await this.addDenomButton.click();
    await this.dialog().locator('input[name="denom"]').waitFor({ state: 'visible', timeout: 10000 });
  }

  async openEditDenomForm(denomNumber: string, productName?: string, status = 'Aktif') {
    if (productName) await this.filterBy(productName, status);
    const row = this.rowFor(denomNumber);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Ubah' }).click();
    await this.dialog().locator('input[name="denom"]').waitFor({ state: 'visible', timeout: 10000 });
  }

  async fillDenom(value: string) {
    await this.dialog().locator('input[name="denom"]').fill(value);
    await this.page.waitForTimeout(300);
  }

  /** Pilih produk via combobox (mis. 'Prepaid' / 'Prepaid Kompor Listrik'). */
  async selectProduct(productName: string) {
    await this.dialog().getByRole('combobox').click();
    await this.page.waitForTimeout(1200);
    await this.page.locator('[role="option"]', { hasText: productName }).first().click();
    await this.page.waitForTimeout(800);
  }

  /** Baca teks yang sedang terpilih di combobox produk. */
  async selectedProduct(): Promise<string> {
    const text = await this.dialog().getByRole('combobox').textContent();
    return (text ?? '').trim();
  }

  /** Set status aktif/nonaktif via switch di form. */
  async setStatus(wantActive: boolean) {
    const sw = this.dialog().getByRole('switch');
    const want = wantActive ? 'checked' : 'unchecked';
    if ((await sw.getAttribute('data-state')) !== want) {
      await sw.click({ force: true });
    }
  }

  isSaveDisabled(): Promise<boolean> {
    return this.saveButton.isDisabled();
  }

  async save() {
    await this.saveButton.click();
    await this.page.waitForTimeout(2000);
  }

  // ---------- FILTER ----------

  async openFilter() {
    await this.filterButton.click();
    await this.page.waitForTimeout(1500);
  }

  /** Klik chip di dialog Filter (teks = label chip, mis. 'Aktif' / 'Prepaid Kompor Listrik'). */
  async toggleFilterChip(label: string) {
    await this.dialog().getByText(label, { exact: true }).click();
    await this.page.waitForTimeout(400);
  }

  /** Pastikan chip dalam kondisi terpilih (idempotent): klik hanya bila belum aktif. */
  async ensureFilterChipSelected(label: string) {
    const chip = this.dialog().getByText(label, { exact: true }).first();
    await chip.waitFor({ state: 'visible', timeout: 10000 });
    const cls = await chip.getAttribute('class');
    const selected = (cls ?? '').includes('bg-primary');
    if (!selected) {
      await chip.click();
      await this.page.waitForTimeout(400);
    }
  }

  async applyFilter() {
    await this.dialog().getByRole('button', { name: 'Terapkan' }).click();
    await this.page.waitForTimeout(2500);
  }

  async resetFilter() {
    await this.dialog().getByRole('button', { name: 'Reset' }).click();
    await this.page.waitForTimeout(2500);
  }

  /** Terapkan Filter produk + status lalu tunggu list ter-filter (idempotent). */
  async filterBy(productName: string, status = 'Aktif') {
    await this.openFilter();
    await this.ensureFilterChipSelected(status);
    await this.ensureFilterChipSelected(productName);
    await this.applyFilter();
  }

  // ---------- TABLE ----------

  /** Format nominal seperti yang ditampilkan tabel: 90003036 -> '90.003.036'. */
  formatDenom(value: string): string {
    return Number(value).toLocaleString('id-ID');
  }

  rowFor(denomNumber: string): Locator {
    return this.page.locator('main tbody tr', { hasText: this.formatDenom(denomNumber) }).first();
  }

  /** Cari row yang memuat denom di seluruh halaman (scroll row ke view). */
  async findRow(denomNumber: string): Promise<Locator | null> {
    const formatted = this.formatDenom(denomNumber);
    const rows = this.page.locator('main tbody tr');
    const n = await rows.count();
    for (let i = 0; i < n; i++) {
      const text = (await rows.nth(i).textContent()) ?? '';
      if (text.includes(formatted)) return rows.nth(i);
    }
    return null;
  }

  // ---------- DELETE ----------

  async deleteDenom(denomNumber: string, productName?: string) {
    if (productName) await this.filterBy(productName);
    const row = await this.findRow(denomNumber);
    if (!row) return;
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Hapus' }).click();
    await this.page.getByRole('button', { name: 'Lanjutkan' }).click();
    await this.page.waitForTimeout(1500);
  }
}
