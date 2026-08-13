import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object - Master Data Produk pada webview BOT PPOB NONA.
 * Halaman dibuka lewat popup (klik "Masuk" BOT PPOB NONA di portal).
 *
 * Karakteristik menu Produk:
 *  - Heading h2 "Produk".
 *  - Ada pencarian (input#search "Cari Produk..."), tombol "Tambah Produk".
 *  - Row action: "Ubah" & "Hapus".
 *  - Form Tambah/Ubah INLINE: field code (Kode Produk), name (Nama Produk),
 *    description (textarea Deskripsi), switch Status default checked.
 *  - Hapus via dialog "Apakah Anda yakin ingin menghapus Produk ini?" (Batal/Lanjutkan).
 *    Delete langsung berhasil meski status masih Aktif.
 */
const WEBVIEW = 'https://backoffice-ppob-nona-webview-playground.lentera-app.id';

export class PpobNonaProductPage {
  readonly page: Page;
  readonly productHeading: Locator;
  readonly addProductButton: Locator;
  readonly saveButton: Locator;
  readonly statusSwitch: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productHeading = page.getByRole('heading', { name: 'Produk', level: 2 });
    this.addProductButton = page.getByRole('button', { name: 'Tambah Produk' });
    this.saveButton = page.locator('form button[type="submit"]');
    this.statusSwitch = page.locator('form [role="switch"]');
  }

  /** Buka webview BOT PPOB NONA lalu arahkan ke halaman Master Produk. */
  static async open(portalPage: Page): Promise<PpobNonaProductPage> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await PpobNonaProductPage.openOnce(portalPage);
      } catch (err) {
        lastError = err as Error;
        await portalPage.waitForTimeout(3000);
      }
    }
    throw lastError;
  }

  private static async openOnce(portalPage: Page): Promise<PpobNonaProductPage> {
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
    const product = new PpobNonaProductPage(webview);
    await product.openProductPage();
    return product;
  }

  async openProductPage() {
    await this.page.goto(WEBVIEW + '/master/product');
    await expect(this.productHeading).toBeVisible({ timeout: 15000 });
    await expect(this.addProductButton).toBeVisible({ timeout: 15000 });
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  // ---------- SEARCH ----------

  async search(keyword: string) {
    await this.page.locator('main input#search').fill(keyword);
    await this.page.waitForTimeout(1500);
  }

  rowFor(keyword: string): Locator {
    return this.page.locator('main tbody tr', { hasText: keyword }).first();
  }

  /** True bila search menampilkan baris yang memuat keyword tsb. */
  async hasRow(keyword: string): Promise<boolean> {
    await this.search(keyword);
    const text = await this.page.locator('main tbody').textContent().catch(() => '');
    return !!text && text.includes(keyword);
  }

  // ---------- FORM ----------

  async openAddProductForm() {
    await this.addProductButton.click();
    await this.page.locator('form input[name="code"]').waitFor({ state: 'visible', timeout: 10000 });
  }

  async openEditProductForm(keyword: string) {
    await this.search(keyword);
    const row = this.rowFor(keyword);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Ubah' }).click();
    await this.page.locator('form input[name="code"]').waitFor({ state: 'visible', timeout: 10000 });
  }

  private form(): Locator {
    return this.page.locator('form').last();
  }

  async fillForm(data: { code?: string; name?: string; description?: string }) {
    if (data.code !== undefined) await this.form().locator('input[name="code"]').fill(data.code);
    if (data.name !== undefined) await this.form().locator('input[name="name"]').fill(data.name);
    if (data.description !== undefined)
      await this.form().locator('textarea[name="description"]').fill(data.description);
    await this.page.waitForTimeout(500);
  }

  /** Set status aktif/nonaktif via switch. */
  async setStatus(wantActive: boolean) {
    const want = wantActive ? 'checked' : 'unchecked';
    if ((await this.statusSwitch.getAttribute('data-state')) !== want) {
      await this.statusSwitch.click({ force: true });
      await this.page.waitForTimeout(500);
    }
  }

  isSaveDisabled(): Promise<boolean> {
    return this.saveButton.isDisabled();
  }

  async waitSaveEnabled(timeout = 10000) {
    await expect(this.saveButton).toBeEnabled({ timeout });
  }

  async save() {
    await this.waitSaveEnabled();
    await this.saveButton.click();
    await this.page.waitForTimeout(2500);
    await expect(this.addProductButton).toBeVisible({ timeout: 10000 });
  }

  // ---------- DELETE ----------

  /**
   * Hapus produk dengan keyword lalu verifikasi hilang di sisi server
   * (reload + cek berulang, karena list bisa menampilkan cache sebelum reload).
   */
  async deleteProduct(keyword: string) {
    await this.search(keyword);
    const row = this.rowFor(keyword);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Hapus' }).click();
    await this.page.getByRole('button', { name: 'Lanjutkan' }).click();
    await this.page.waitForTimeout(2000);
    await expect(async () => {
      await this.page.reload();
      await expect(this.productHeading).toBeVisible({ timeout: 15000 });
      expect(await this.hasRow(keyword)).toBeFalsy();
    }).toPass({ timeout: 30000 });
  }
}