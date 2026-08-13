import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object - Master Data Bank pada webview BOT PPOB NONA.
 * Halaman dibuka lewat popup (klik "Masuk" BOT PPOB NONA di portal).
 *
 * Perbedaan vs menu Denom:
 *  - Ada kolom pencarian (input#search "Cari Bank...") -> cari data via search.
 *  - Form Tambah/Ubah dirender INLINE (bukan dialog): field name/code/short_name/swift_code
 *    + tombol Simpan & Kembali. Simpan disabled selama form belum valid.
 *  - Tidak ada status (aktif/nonaktif) seperti Denom.
 *  - Hapus via dialog konfirmasi "Apakah Anda yakin ingin menghapus bank ini?"
 */
const WEBVIEW = 'https://backoffice-ppob-nona-webview-playground.lentera-app.id';

export class PpobNonaBankPage {
  readonly page: Page;
  readonly bankHeading: Locator;
  readonly addBankButton: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.bankHeading = page.getByRole('heading', { name: 'Master Bank' });
    this.addBankButton = page.getByRole('button', { name: 'Tambah Bank' });
    this.saveButton = page.locator('form button[type="submit"]');
  }

  /** Buka webview BOT PPOB NONA lalu arahkan ke halaman Master Bank. */
  static async open(portalPage: Page): Promise<PpobNonaBankPage> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await PpobNonaBankPage.openOnce(portalPage);
      } catch (err) {
        lastError = err as Error;
        await portalPage.waitForTimeout(3000);
      }
    }
    throw lastError;
  }

  private static async openOnce(portalPage: Page): Promise<PpobNonaBankPage> {
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
    const bank = new PpobNonaBankPage(webview);
    await bank.openBankPage();
    return bank;
  }

  async openBankPage() {
    await this.page.goto(WEBVIEW + '/master/bank');
    await expect(this.bankHeading).toBeVisible({ timeout: 15000 });
    await expect(this.addBankButton).toBeVisible({ timeout: 15000 });
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  // ---------- SEARCH ----------

  private searchInput(): Locator {
    return this.page.locator('main input#search');
  }

  async search(keyword: string) {
    await this.searchInput().fill(keyword);
    await this.page.waitForTimeout(1500);
  }

  rowFor(name: string): Locator {
    return this.page.locator('main tbody tr', { hasText: name }).first();
  }

  // ---------- FORM (Tambah / Ubah, inline) ----------

  async openAddBankForm() {
    await this.addBankButton.click();
    await this.page.locator('form input[name="name"]').waitFor({ state: 'visible', timeout: 10000 });
  }

  async openEditBankForm(name: string) {
    const row = this.rowFor(name);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Ubah' }).click();
    await this.page.locator('form input[name="name"]').waitFor({ state: 'visible', timeout: 10000 });
  }

  async fillForm(data: { name?: string; code?: string; shortName?: string; swiftCode?: string }) {
    if (data.name !== undefined) await this.page.locator('form input[name="name"]').fill(data.name);
    if (data.code !== undefined) await this.page.locator('form input[name="code"]').fill(data.code);
    if (data.shortName !== undefined) await this.page.locator('form input[name="short_name"]').fill(data.shortName);
    if (data.swiftCode !== undefined) await this.page.locator('form input[name="swift_code"]').fill(data.swiftCode);
    await this.page.waitForTimeout(500);
  }

  isSaveDisabled(): Promise<boolean> {
    return this.saveButton.isDisabled();
  }

  /** Tunggu tombol Simpan jadi enabled (validasi React di-render async). */
  async waitSaveEnabled(timeout = 10000) {
    await expect(this.saveButton).toBeEnabled({ timeout });
  }

  async save() {
    await this.waitSaveEnabled();
    await this.saveButton.click();
    await this.page.waitForTimeout(2500);
    await expect(this.addBankButton).toBeVisible({ timeout: 10000 });
  }

  // ---------- DELETE ----------

  async deleteBank(name: string) {
    await this.search(name);
    const row = this.rowFor(name);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Hapus' }).click();
    await this.page.getByRole('button', { name: 'Lanjutkan' }).click();
    await this.page.waitForTimeout(1500);
  }

  /** True bila search menampilkan baris yang memuat nama bank tsb. */
  async hasRow(name: string): Promise<boolean> {
    await this.search(name);
    const text = await this.page.locator('main tbody').textContent().catch(() => '');
    return !!text && text.includes(name);
  }
}
