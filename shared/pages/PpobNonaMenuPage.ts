import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object - Master Data Menu pada webview BOT PPOB NONA.
 * Halaman dibuka lewat popup (klik "Masuk" BOT PPOB NONA di portal).
 *
 * Karakteristik menu Menu:
 *  - Heading h2 "Daftar Menu", pencarian (input#search "Cari Menu..."),
 *    tombol "Tambah Menu" & "Filter".
 *  - Row action HANYA "Ubah" (menu TIDAK punya fitur hapus).
 *  - Form Tambah/Ubah INLINE: title (Nama Menu), code, icon, dropdown Parent,
 *    dropdown Urutan (Default/1..5), permissionString (actions pisah koma),
 *    description (textarea), switch Status default UNCHECKED (wajib di-check
 *    agar Simpan enabled).
 *  - Kolom tabel: Nama, Kode, Deskripsi, Sort Order, Parent, Status.
 */
const WEBVIEW = 'https://backoffice-ppob-nona-webview-playground.lentera-app.id';

export class PpobNonaMenuPage {
  readonly page: Page;
  readonly menuHeading: Locator;
  readonly addMenuButton: Locator;
  readonly saveButton: Locator;
  readonly statusSwitch: Locator;

  constructor(page: Page) {
    this.page = page;
    this.menuHeading = page.getByRole('heading', { name: 'Daftar Menu', level: 2 });
    this.addMenuButton = page.getByRole('button', { name: 'Tambah Menu' });
    this.saveButton = page.locator('form button[type="submit"]');
    this.statusSwitch = page.locator('form [role="switch"]');
  }

  /** Buka webview BOT PPOB NONA lalu arahkan ke halaman Master Menu. */
  static async open(portalPage: Page): Promise<PpobNonaMenuPage> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await PpobNonaMenuPage.openOnce(portalPage);
      } catch (err) {
        lastError = err as Error;
        await portalPage.waitForTimeout(3000);
      }
    }
    throw lastError;
  }

  private static async openOnce(portalPage: Page): Promise<PpobNonaMenuPage> {
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
    const menu = new PpobNonaMenuPage(webview);
    await menu.openMenuPage();
    return menu;
  }

  async openMenuPage() {
    await this.page.goto(WEBVIEW + '/master/menu');
    await expect(this.menuHeading).toBeVisible({ timeout: 15000 });
    await expect(this.addMenuButton).toBeVisible({ timeout: 15000 });
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

  async openAddMenuForm() {
    await this.addMenuButton.click();
    await this.page.locator('form input[name="title"]').waitFor({ state: 'visible', timeout: 10000 });
  }

  async openEditMenuForm(keyword: string) {
    await this.search(keyword);
    const row = this.rowFor(keyword);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Ubah' }).click();
    await this.page.locator('form input[name="title"]').waitFor({ state: 'visible', timeout: 10000 });
  }

  private form(): Locator {
    return this.page.locator('form').last();
  }

  /** Pilih opsi dari dropdown dengan tombol trigger berlabel (mis. 'Pilih parent menu'). */
  async selectDropdown(triggerLabel: string, option: string, exact = false) {
    await this.form().locator('button', { hasText: triggerLabel }).first().click();
    await this.page.waitForTimeout(1200);
    const opt = this.page
      .locator('[role="option"]')
      .filter({ hasText: option })
      .first();
    if (exact) await this.page.getByRole('option', { name: option, exact: true }).first().click();
    else await opt.click();
    await this.page.waitForTimeout(800);
  }

  async fillForm(data: {
    title?: string;
    code?: string;
    icon?: string;
    parent?: string;
    sortOrder?: string;
    permissionString?: string;
    description?: string;
  }) {
    if (data.title !== undefined) await this.form().locator('input[name="title"]').fill(data.title);
    if (data.code !== undefined) await this.form().locator('input[name="code"]').fill(data.code);
    if (data.icon !== undefined) await this.form().locator('input[name="icon"]').fill(data.icon);
    if (data.parent !== undefined) await this.selectDropdown('Pilih parent menu', data.parent, true);
    if (data.sortOrder !== undefined) await this.selectDropdown('Default', data.sortOrder, true);
    if (data.permissionString !== undefined)
      await this.form().locator('input[name="permissionString"]').fill(data.permissionString);
    if (data.description !== undefined)
      await this.form().locator('textarea[name="description"]').fill(data.description);
    await this.page.waitForTimeout(500);
  }

  /** Set status aktif/nonaktif via switch. */
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
    await this.page.waitForTimeout(3000);
    await expect(this.addMenuButton).toBeVisible({ timeout: 10000 });
  }
}