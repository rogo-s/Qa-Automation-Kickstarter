import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object - Master Data Application pada webview BOT PPOB NONA.
 * Halaman: /master/app-version
 *
 * Probe 28-08-2026:
 *  - Heading "Master Application", deskripsi "Berikut adalah daftar application."
 *  - Search placeholder "Cari Aplikasi...", button "Tambah Aplikasi"
 *  - Tabel: NO, VERSION, VERSION CODE, URL, LOCAL PATH, DIBUAT
 *  - Form modal: version (Masukan versi), versionCode (Masukan kode vesi),
 *    url opsional (Contoh: https://example.com), File Aplikasi (.apk Max 100MB) input[type=file] accept=.apk
 *    Simpan disabled sampai version+versionCode+file terisi.
 *  - Row action hanya "Download" (tidak ada Ubah/Hapus)
 */
const WEBVIEW = 'https://backoffice-ppob-nona-webview-playground.lentera-app.id';

export class PpobNonaApplicationPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly addButton: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Master Application' });
    this.addButton = page.getByRole('button', { name: 'Tambah Aplikasi' });
    this.saveButton = page.locator('form button[type="submit"]');
  }

  static async open(portalPage: Page): Promise<PpobNonaApplicationPage> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await PpobNonaApplicationPage.openOnce(portalPage);
      } catch (err) {
        lastError = err as Error;
        await portalPage.waitForTimeout(3000);
      }
    }
    throw lastError;
  }

  private static async openOnce(portalPage: Page): Promise<PpobNonaApplicationPage> {
    await portalPage.goto('/');
    await portalPage.waitForLoadState('domcontentloaded');
    await portalPage.getByText('Pilih BOT Anda').waitFor({ state: 'visible', timeout: 15000 });
    const card = portalPage.locator('div.p-4.border.rounded-lg', { hasText: 'BOT PPOB NONA' }).first();
    await expect(card).toBeVisible({ timeout: 15000 });
    const popupPromise = portalPage.waitForEvent('popup', { timeout: 20000 });
    await card.getByRole('button', { name: 'Masuk' }).click();
    const webview = await popupPromise;
    await webview.waitForLoadState('domcontentloaded');
    await webview.waitForURL(/backoffice-ppob-nona-webview-playground\.lentera-app\.id\/?$/, { timeout: 30000 });
    await webview.waitForTimeout(1500);
    const app = new PpobNonaApplicationPage(webview);
    await app.openPage();
    return app;
  }

  async openPage() {
    await this.page.goto(WEBVIEW + '/master/app-version');
    await expect(this.heading).toBeVisible({ timeout: 15000 });
    await expect(this.addButton).toBeVisible({ timeout: 15000 });
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  // ---------- SEARCH ----------
  private searchInput(): Locator {
    return this.page.locator('main input[placeholder*="Cari"]');
  }

  async search(keyword: string) {
    await this.searchInput().fill(keyword);
    await this.page.waitForTimeout(1500);
  }

  rowFor(keyword: string): Locator {
    return this.page.locator('main tbody tr', { hasText: keyword }).first();
  }

  async hasRow(keyword: string): Promise<boolean> {
    await this.search(keyword);
    const text = await this.page.locator('main tbody').textContent().catch(() => '');
    return !!text && text.includes(keyword);
  }

  // ---------- FORM ----------
  async openAddForm() {
    await this.addButton.click();
    await this.page.locator('form input[name="version"]').waitFor({ state: 'visible', timeout: 10000 });
  }

  private form(): Locator {
    return this.page.locator('form').last();
  }

  async fillForm(data: { version?: string; versionCode?: string; url?: string }) {
    if (data.version !== undefined) await this.form().locator('input[name="version"]').fill(data.version);
    if (data.versionCode !== undefined)
      await this.form().locator('input[name="versionCode"]').fill(data.versionCode);
    if (data.url !== undefined) await this.form().locator('input[name="url"]').fill(data.url);
    await this.page.waitForTimeout(500);
  }

  /** Upload file via input[type=file] accept .apk (hidden, perlu force) */
  async uploadFile(filePath: string) {
    const input = this.form().locator('input[type="file"]');
    // input hidden (class hidden) → Playwright perlu force atau cari via page
    await this.page.locator('form input[type="file"]').first().setInputFiles(filePath);
    await this.page.waitForTimeout(1000);
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
    await expect(this.addButton).toBeVisible({ timeout: 10000 });
  }

  // ---------- DOWNLOAD ----------
  async downloadFirstRow() {
    const row = this.page.locator('main tbody tr').first();
    await row.getByRole('button', { name: 'Open menu' }).click();
    const downloadPromise = this.page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
    await this.page.getByRole('menuitem', { name: 'Download' }).click();
    return downloadPromise;
  }
}
