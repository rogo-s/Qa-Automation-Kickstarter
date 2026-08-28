import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object - Master Data Settings pada webview BOT PPOB NONA.
 * Halaman dibuka lewat popup (klik "Masuk" BOT PPOB NONA di portal).
 *
 * Karakteristik menu Settings (probe 28-08-2026):
 *  - Heading h1/h2 "Master Settings", deskripsi "Berikut adalah daftar settings."
 *  - Ada pencarian (input placeholder "Cari Setting..."), tombol "Tambah Settings".
 *  - Tabel kolom: NO, RULE CODE, VALUE, DESCRIPTION, STATUS, CREATED, UPDATED
 *  - Form Tambah/Ubah modal inline: rule_code (Masukan rule code), value (Masukan value),
 *    description (textarea Masukan deskripsi), switch Aktif default checked.
 *    Tombol Simpan disabled sampai semua field wajib terisi (rule_code+value+description).
 *  - Row action via "Open menu" -> Ubah / Hapus. Hapus via dialog "Lanjutkan".
 *  - Value untuk transaction suspect (MAX_ADDITIONAL_AMOUNT, MAX_FORCE_PAYMENT_AMOUNT) tampil "Rp10.000".
 */
const WEBVIEW = 'https://backoffice-ppob-nona-webview-playground.lentera-app.id';

export class PpobNonaSettingsPage {
  readonly page: Page;
  readonly settingsHeading: Locator;
  readonly addSettingsButton: Locator;
  readonly saveButton: Locator;
  readonly statusSwitch: Locator;

  constructor(page: Page) {
    this.page = page;
    this.settingsHeading = page.getByRole('heading', { name: 'Master Settings' });
    this.addSettingsButton = page.getByRole('button', { name: 'Tambah Settings' });
    this.saveButton = page.locator('form button[type="submit"]');
    this.statusSwitch = page.locator('form [role="switch"]');
  }

  /** Buka webview BOT PPOB NONA lalu arahkan ke halaman Master Settings. */
  static async open(portalPage: Page): Promise<PpobNonaSettingsPage> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await PpobNonaSettingsPage.openOnce(portalPage);
      } catch (err) {
        lastError = err as Error;
        await portalPage.waitForTimeout(3000);
      }
    }
    throw lastError;
  }

  private static async openOnce(portalPage: Page): Promise<PpobNonaSettingsPage> {
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
    const settings = new PpobNonaSettingsPage(webview);
    await settings.openSettingsPage();
    return settings;
  }

  async openSettingsPage() {
    await this.page.goto(WEBVIEW + '/master/settings');
    await expect(this.settingsHeading).toBeVisible({ timeout: 15000 });
    await expect(this.addSettingsButton).toBeVisible({ timeout: 15000 });
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  // ---------- SEARCH ----------

  private searchInput(): Locator {
    // placeholder "Cari Setting..." (probe 28-08-2026)
    return this.page.locator('main input[placeholder*="Cari"]');
  }

  async search(keyword: string) {
    await this.searchInput().fill(keyword);
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

  // ---------- FORM (Tambah / Ubah) ----------

  async openAddSettingsForm() {
    await this.addSettingsButton.click();
    await this.page.locator('form input[name="rule_code"]').waitFor({ state: 'visible', timeout: 10000 });
  }

  async openEditSettingsForm(ruleCode: string) {
    await this.search(ruleCode);
    const row = this.rowFor(ruleCode);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Ubah' }).click();
    await this.page.locator('form input[name="rule_code"]').waitFor({ state: 'visible', timeout: 10000 });
  }

  private form(): Locator {
    return this.page.locator('form').last();
  }

  async fillForm(data: { ruleCode?: string; value?: string; description?: string }) {
    if (data.ruleCode !== undefined) await this.form().locator('input[name="rule_code"]').fill(data.ruleCode);
    if (data.value !== undefined) await this.form().locator('input[name="value"]').fill(data.value);
    if (data.description !== undefined)
      await this.form().locator('textarea[name="description"]').fill(data.description);
    await this.page.waitForTimeout(500);
  }

  /** Set status Aktif via switch (checked = Aktif). */
  async setStatus(wantActive: boolean) {
    const want = wantActive ? 'checked' : 'unchecked';
    if ((await this.statusSwitch.getAttribute('data-state')) !== want) {
      await this.statusSwitch.click({ force: true });
      await this.page.waitForTimeout(600);
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
    await expect(this.addSettingsButton).toBeVisible({ timeout: 10000 });
  }

  // ---------- DELETE ----------

  async deleteSettings(ruleCode: string) {
    await this.search(ruleCode);
    const row = this.rowFor(ruleCode);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Hapus' }).click();
    await this.page.getByRole('button', { name: 'Lanjutkan' }).click();
    await this.page.waitForTimeout(2000);
  }
}
