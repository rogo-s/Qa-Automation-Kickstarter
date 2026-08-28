import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object - Master Data Device pada webview BOT PPOB NONA.
 * Halaman: /master/unit-device
 *
 * Probe 28-08-2026:
 *  - Heading "Master Device", deskripsi "Berikut adalah daftar device."
 *  - Tombol filter "Pilih Unit" + "Tambah Device", search "Cari Device..."
 *  - Tabel: NO, NAMA DEVICE, UNIT, MODEL, MANUFACTURER, ANDROID, ANDROID ID, HARDWARE ID
 *  - Form modal: name (Masukan nama device), Unit dropdown (Pilih Unit), qr_code (file jpg/png 5MB)
 *    Simpan disabled sampai name+unit+file? (probe: Simpan disabled=true awal)
 *  - Row action "Open menu" -> Ubah / Hapus
 */
const WEBVIEW = 'https://backoffice-ppob-nona-webview-playground.lentera-app.id';

export class PpobNonaDevicePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly addButton: Locator;
  readonly saveButton: Locator;
  readonly filterUnitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Master Device' });
    this.addButton = page.getByRole('button', { name: 'Tambah Device' });
    this.saveButton = page.locator('form button[type="submit"]');
    this.filterUnitButton = page.getByRole('button', { name: 'Pilih Unit' }).first();
  }

  static async open(portalPage: Page): Promise<PpobNonaDevicePage> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await PpobNonaDevicePage.openOnce(portalPage);
      } catch (err) {
        lastError = err as Error;
        await portalPage.waitForTimeout(3000);
      }
    }
    throw lastError;
  }

  private static async openOnce(portalPage: Page): Promise<PpobNonaDevicePage> {
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
    const device = new PpobNonaDevicePage(webview);
    await device.openPage();
    return device;
  }

  async openPage() {
    await this.page.goto(WEBVIEW + '/master/unit-device');
    await expect(this.heading).toBeVisible({ timeout: 15000 });
    await expect(this.addButton).toBeVisible({ timeout: 15000 });
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  // ---------- SEARCH / FILTER ----------
  private searchInput(): Locator {
    return this.page.locator('main input[placeholder*="Cari"]');
  }

  async search(keyword: string) {
    await this.searchInput().fill(keyword);
    await this.page.waitForTimeout(1500);
  }

  /** Filter tabel via dropdown Pilih Unit di header */
  async filterByUnit(unitName: string) {
    await this.filterUnitButton.click();
    await this.page.getByRole('option', { name: unitName }).click().catch(async () => {
      // fallback: locator text
      await this.page.locator('[role="option"]', { hasText: unitName }).first().click();
    });
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
    await this.page.locator('form input[name="name"]').waitFor({ state: 'visible', timeout: 10000 });
  }

  async openEditForm(deviceName: string) {
    await this.search(deviceName);
    const row = this.rowFor(deviceName);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Ubah' }).click();
    await this.page.locator('form input[name="name"]').waitFor({ state: 'visible', timeout: 10000 });
  }

  private form(): Locator {
    return this.page.locator('form').last();
  }

  async fillForm(data: { name?: string }) {
    if (data.name !== undefined) await this.form().locator('input[name="name"]').fill(data.name);
    await this.page.waitForTimeout(500);
  }

  /** Pilih Unit di form (dropdown Pilih Unit) */
  async selectUnit(unitName: string) {
    // form dropdown trigger "Pilih Unit"
    const trigger = this.form().getByRole('button', { name: /Pilih Unit/ }).first();
    // fallback: button with span Pilih Unit
    const btn = this.form().locator('button', { hasText: 'Pilih Unit' }).first();
    const toClick = (await trigger.count()) > 0 ? trigger : btn;
    await toClick.click();
    await this.page.waitForTimeout(800);
    await this.page.getByRole('option', { name: unitName }).click().catch(async () => {
      await this.page.locator('[role="option"]', { hasText: unitName }).first().click();
    });
    await this.page.waitForTimeout(600);
  }

  async uploadQr(filePath: string) {
    const input = this.form().locator('input[type="file"]');
    await input.setInputFiles(filePath);
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

  // ---------- DELETE ----------
  async deleteDevice(deviceName: string) {
    await this.search(deviceName);
    const row = this.rowFor(deviceName);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Hapus' }).click();
    await this.page.getByRole('button', { name: 'Lanjutkan' }).click();
    await this.page.waitForTimeout(2000);
  }
}
