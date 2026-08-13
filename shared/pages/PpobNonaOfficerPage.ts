import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object - Master Data Officer pada webview BOT PPOB NONA.
 * Halaman dibuka lewat popup (klik "Masuk" BOT PPOB NONA di portal).
 *
 * Perbedaan vs menu Bank:
 *  - Kolom tabel: Nama, Email, Tanggal Dibuat, Status.
 *  - Ada pencarian (input#search "Cari...") dan Filter dialog chip Status (Aktif/Tidak Aktif).
 *  - Form Tambah/Ubah inline: name, email, password (password kosong saat edit), switch Status.
 *  - Hapus via dialog konfirmasi "Apakah Anda yakin ingin menghapus officer ini?".
 */
const WEBVIEW = 'https://backoffice-ppob-nona-webview-playground.lentera-app.id';

export class PpobNonaOfficerPage {
  readonly page: Page;
  readonly officerHeading: Locator;
  readonly addOfficerButton: Locator;
  readonly filterButton: Locator;
  readonly saveButton: Locator;
  readonly statusSwitch: Locator;

  constructor(page: Page) {
    this.page = page;
    this.officerHeading = page.getByRole('heading', { name: 'Master Officer' });
    this.addOfficerButton = page.getByRole('button', { name: 'Tambah Officer' });
    this.filterButton = page.getByRole('button', { name: 'Filter' }).first();
    this.saveButton = page.locator('form button[type="submit"]');
    this.statusSwitch = page.locator('form [role="switch"]');
  }

  /** Buka webview BOT PPOB NONA lalu arahkan ke halaman Master Officer. */
  static async open(portalPage: Page): Promise<PpobNonaOfficerPage> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await PpobNonaOfficerPage.openOnce(portalPage);
      } catch (err) {
        lastError = err as Error;
        await portalPage.waitForTimeout(3000);
      }
    }
    throw lastError;
  }

  private static async openOnce(portalPage: Page): Promise<PpobNonaOfficerPage> {
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
    const officer = new PpobNonaOfficerPage(webview);
    await officer.openOfficerPage();
    return officer;
  }

  async openOfficerPage() {
    await this.page.goto(WEBVIEW + '/master/officer');
    await expect(this.officerHeading).toBeVisible({ timeout: 15000 });
    await expect(this.addOfficerButton).toBeVisible({ timeout: 15000 });
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  // ---------- SEARCH & DISTINGUISH NAME ----------

  private searchInput(): Locator {
    return this.page.locator('main input#search').first();
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

  // ---------- FILTER (chip Status) ----------

  async openFilter() {
    await this.filterButton.click();
    await this.page.waitForTimeout(1500);
  }

  /** Pastikan chip dalam kondisi terpilih (idempotent): klik hanya bila belum aktif. */
  async ensureFilterChipSelected(label: string) {
    const chip = this.page.locator('[role="dialog"]').getByText(label, { exact: true }).first();
    await chip.waitFor({ state: 'visible', timeout: 10000 });
    const cls = await chip.getAttribute('class');
    const selected = (cls ?? '').includes('bg-primary');
    if (!selected) {
      await chip.click();
      await this.page.waitForTimeout(400);
    }
  }

  async applyFilter() {
    await this.page.locator('[role="dialog"]').getByRole('button', { name: 'Terapkan' }).click();
    await this.page.waitForTimeout(2500);
  }

  async filterByStatus(status: string) {
    await this.openFilter();
    await this.ensureFilterChipSelected(status);
    await this.applyFilter();
  }

  // ---------- FORM (Tambah / Ubah, inline) ----------

  async openAddOfficerForm() {
    await this.addOfficerButton.click();
    await this.page.locator('form input[name="name"]').waitFor({ state: 'visible', timeout: 10000 });
  }

  async openEditOfficerForm(keyword: string) {
    const row = this.rowFor(keyword);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Ubah' }).click();
    await this.page.locator('form input[name="name"]').waitFor({ state: 'visible', timeout: 10000 });
  }

  async fillForm(data: { name?: string; email?: string; password?: string }) {
    if (data.name !== undefined) await this.page.locator('form input[name="name"]').fill(data.name);
    if (data.email !== undefined) await this.page.locator('form input[name="email"]').fill(data.email);
    if (data.password !== undefined) await this.page.locator('form input[name="password"]').fill(data.password);
    await this.page.waitForTimeout(500);
  }

  /** Set status aktif/nonaktif via switch di form. */
  async setStatus(wantActive: boolean) {
    const want = wantActive ? 'checked' : 'unchecked';
    if ((await this.statusSwitch.getAttribute('data-state')) !== want) {
      await this.statusSwitch.click({ force: true });
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
    await expect(this.addOfficerButton).toBeVisible({ timeout: 10000 });
  }

  // ---------- DELETE ----------

  async deleteOfficer(keyword: string) {
    await this.search(keyword);
    const row = this.rowFor(keyword);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Hapus' }).click();
    await this.page.getByRole('button', { name: 'Lanjutkan' }).click();
    await this.page.waitForTimeout(1500);
  }
}