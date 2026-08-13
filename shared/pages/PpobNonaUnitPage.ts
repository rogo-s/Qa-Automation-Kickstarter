import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object - Master Data Unit pada webview BOT PPOB NONA.
 * Halaman dibuka lewat popup (klik "Masuk" BOT PPOB NONA di portal).
 *
 * Karakteristik menu Unit:
 *  - Heading h2 "Daftar Unit" (bukan h1).
 *  - Ada pencarian (input#search "Cari Unit..."), tombol "Tambah Unit".
 *    TIDAK ada tombol Filter & row action hanya "Hapus" (tidak ada "Ubah").
 *  - Form Tambah INLINE: field code (Kode Unit), name (Nama Unit),
 *    address (textarea Alamat), switch Status default checked.
 *  - Hapus via dialog "Apakah Anda yakin ingin menghapus unit ini?" (Batal/Lanjutkan).
 *    Delete langsung berhasil meski status masih Aktif.
 */
const WEBVIEW = 'https://backoffice-ppob-nona-webview-playground.lentera-app.id';

export class PpobNonaUnitPage {
  readonly page: Page;
  readonly unitHeading: Locator;
  readonly addUnitButton: Locator;
  readonly saveButton: Locator;
  readonly statusSwitch: Locator;

  constructor(page: Page) {
    this.page = page;
    this.unitHeading = page.getByRole('heading', { name: 'Daftar Unit', level: 2 });
    this.addUnitButton = page.getByRole('button', { name: 'Tambah Unit' });
    this.saveButton = page.locator('form button[type="submit"]');
    this.statusSwitch = page.locator('form [role="switch"]');
  }

  /** Buka webview BOT PPOB NONA lalu arahkan ke halaman Master Unit. */
  static async open(portalPage: Page): Promise<PpobNonaUnitPage> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await PpobNonaUnitPage.openOnce(portalPage);
      } catch (err) {
        lastError = err as Error;
        await portalPage.waitForTimeout(3000);
      }
    }
    throw lastError;
  }

  private static async openOnce(portalPage: Page): Promise<PpobNonaUnitPage> {
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
    const unit = new PpobNonaUnitPage(webview);
    await unit.openUnitPage();
    return unit;
  }

  async openUnitPage() {
    await this.page.goto(WEBVIEW + '/master/unit');
    await expect(this.unitHeading).toBeVisible({ timeout: 15000 });
    await expect(this.addUnitButton).toBeVisible({ timeout: 15000 });
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

  async openAddUnitForm() {
    await this.addUnitButton.click();
    await this.page.locator('form input[name="code"]').waitFor({ state: 'visible', timeout: 10000 });
  }

  private form(): Locator {
    return this.page.locator('form').last();
  }

  async fillForm(data: { code?: string; name?: string; address?: string }) {
    if (data.code !== undefined) await this.form().locator('input[name="code"]').fill(data.code);
    if (data.name !== undefined) await this.form().locator('input[name="name"]').fill(data.name);
    if (data.address !== undefined) await this.form().locator('textarea[name="address"]').fill(data.address);
    await this.page.waitForTimeout(500);
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
    await expect(this.addUnitButton).toBeVisible({ timeout: 10000 });
  }

  // ---------- DELETE ----------

  /**
   * Hapus unit dengan keyword lalu verifikasi hilang di sisi server
   * (reload + cek berulang, karena list bisa menampilkan cache sebelum reload).
   */
  async deleteUnit(keyword: string) {
    await this.search(keyword);
    const row = this.rowFor(keyword);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Hapus' }).click();
    await this.page.getByRole('button', { name: 'Lanjutkan' }).click();
    await this.page.waitForTimeout(2000);
    await expect(async () => {
      await this.page.reload();
      await expect(this.unitHeading).toBeVisible({ timeout: 15000 });
      expect(await this.hasRow(keyword)).toBeFalsy();
    }).toPass({ timeout: 30000 });
  }
}