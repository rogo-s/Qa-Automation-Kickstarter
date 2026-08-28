import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object - Master Data PSP Group pada webview BOT PPOB NONA.
 * Halaman: /master/psp-group
 *
 * Probe 28-08-2026:
 *  - Heading "PSP Group", search "Cari berdasarkan nama...", button "Tambah Group"
 *  - Tabel: NO, KODE GROUP, NAMA GROUP, TIPE SETTLEMENT, NAMA BANK, DESKRIPSI, DIBUAT OLEH
 *  - Form di halaman terpisah: /master/psp-group/add dan /master/psp-group/edit/:id
 *    Fields: code* (Masukkan kode grup...), name* (Masukkan nama grup...),
 *    Rekening Settlement dropdown "Pilih Rekening" (isi: Settlement MANDIRI - 7554312100 - Bank Mandiri dll),
 *    Tipe Settlement combobox "Pilih Tipe Settlement" (BULK/DETAIL), description (Masukkan deskripsi...)
 *    Buttons: Batal, Simpan (type submit, tidak disabled walau kosong — validasi backend)
 *  - Row action "Open menu" -> Ubah / Hapus. Hapus confirm "Apakah Anda yakin ingin menghapus PSP Group ini?" -> Lanjutkan
 */
const WEBVIEW = 'https://backoffice-ppob-nona-webview-playground.lentera-app.id';

export class PpobNonaPspGroupPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly addButton: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'PSP Group' });
    this.addButton = page.getByRole('button', { name: 'Tambah Group' });
    this.saveButton = page.locator('form button[type="submit"]');
  }

  static async open(portalPage: Page): Promise<PpobNonaPspGroupPage> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await PpobNonaPspGroupPage.openOnce(portalPage);
      } catch (err) {
        lastError = err as Error;
        await portalPage.waitForTimeout(3000);
      }
    }
    throw lastError;
  }

  private static async openOnce(portalPage: Page): Promise<PpobNonaPspGroupPage> {
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
    const pspGroup = new PpobNonaPspGroupPage(webview);
    await pspGroup.openPage();
    return pspGroup;
  }

  async openPage() {
    await this.page.goto(WEBVIEW + '/master/psp-group');
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
    await this.page.waitForURL(/\/master\/psp-group\/add$/, { timeout: 15000 });
    await this.page.locator('form input[name="code"]').waitFor({ state: 'visible', timeout: 10000 });
  }

  async openEditForm(groupCode: string) {
    await this.search(groupCode);
    const row = this.rowFor(groupCode);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Ubah' }).click();
    await this.page.waitForURL(/\/master\/psp-group\/edit\//, { timeout: 15000 });
    await this.page.locator('form input[name="code"]').waitFor({ state: 'visible', timeout: 10000 });
  }

  private form(): Locator {
    return this.page.locator('form').last();
  }

  async fillForm(data: { code?: string; name?: string; description?: string }) {
    if (data.code !== undefined) await this.form().locator('input[name="code"]').fill(data.code);
    if (data.name !== undefined) await this.form().locator('input[name="name"]').fill(data.name);
    if (data.description !== undefined)
      await this.form().locator('input[name="description"]').fill(data.description);
    await this.page.waitForTimeout(500);
  }

  /** Pilih Rekening Settlement (dropdown "Pilih Rekening" atau value existing) */
  async selectRekening(keyword: string) {
    // trigger adalah button "Pilih Rekening" atau yang sudah terisi "Settlement ..."
    const trigger = this.form().locator('button', { hasText: /Pilih Rekening|Settlement/ }).first();
    await trigger.click();
    await this.page.waitForTimeout(800);
    // opsi ada di popover/listbox
    const opt = this.page.getByRole('option', { name: new RegExp(keyword, 'i') }).first();
    const fallback = this.page.locator('[role="option"]', { hasText: keyword }).first();
    if ((await opt.count()) > 0) await opt.click();
    else if ((await fallback.count()) > 0) await fallback.click();
    else await this.page.getByText(keyword).first().click().catch(() => {});
    await this.page.waitForTimeout(600);
  }

  /** Pilih Tipe Settlement (combobox BULK / DETAIL) */
  async selectTipe(tipe: 'BULK' | 'DETAIL') {
    const combo = this.form().locator('button[role="combobox"]').first();
    // fallback: button dengan text Pilih Tipe Settlement
    const trigger = (await combo.count()) > 0 ? combo : this.form().locator('button', { hasText: 'Pilih Tipe' }).first();
    await trigger.click();
    await this.page.waitForTimeout(800);
    await this.page.getByRole('option', { name: tipe, exact: true }).click();
    await this.page.waitForTimeout(600);
  }

  isSaveDisabled(): Promise<boolean> {
    return this.saveButton.isDisabled();
  }

  async save() {
    await this.saveButton.click();
    await this.page.waitForTimeout(2500);
    // kembali ke list
    await expect(this.heading).toBeVisible({ timeout: 15000 });
  }

  async cancel() {
    await this.page.getByRole('button', { name: 'Batal' }).click();
    await expect(this.heading).toBeVisible({ timeout: 10000 });
  }

  // ---------- DELETE ----------
  async deleteGroup(groupCode: string) {
    await this.search(groupCode);
    const row = this.rowFor(groupCode);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Hapus' }).click();
    await this.page.getByRole('button', { name: 'Lanjutkan' }).click();
    await this.page.waitForTimeout(2000);
  }
}
