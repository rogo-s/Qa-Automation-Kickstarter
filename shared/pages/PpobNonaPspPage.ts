import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object - Master Data PSP pada webview BOT PPOB NONA.
 * Halaman dibuka lewat popup (klik "Masuk" BOT PPOB NONA di portal).
 *
 * Karakteristik menu PSP:
 *  - Heading h2 "PSP", pencarian (input#search "Cari PSP..."), tombol "Tambah PSP".
 *  - Row action: "Ubah" & "Hapus".
 *  - Form Tambah/Ubah INLINE dengan banyak field: code, type, fullName (Nama PSP),
 *    simpleName (Nama Singkat), min/max amount, vaPrefix, integratorUrl,
 *    integratorSecret, dropdown "Rekening Settlement" (ambil data Settlement Bank
 *    Account yang sudah ada), dropdown "Tipe Settlement" (Bulk/Detail),
 *    rich-text editor Quill untuk "Cara Pembayaran (howToPay)", switch Status.
 *  - Simpan hanya enabled setelah SEMUA field terisi, TERMASUK teks di Quill editor
 *    (pada mode Ubah, Quill tampil kosong sehingga harus diisi ulang).
 *  - Hapus via dialog "Apakah Anda yakin ingin menghapus PSP ini?" (Batal/Lanjutkan).
 */
const WEBVIEW = 'https://backoffice-ppob-nona-webview-playground.lentera-app.id';

export class PpobNonaPspPage {
  readonly page: Page;
  readonly pspHeading: Locator;
  readonly addPspButton: Locator;
  readonly saveButton: Locator;
  readonly statusSwitch: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pspHeading = page.getByRole('heading', { name: 'PSP', level: 2 });
    this.addPspButton = page.getByRole('button', { name: 'Tambah PSP' });
    this.saveButton = page.locator('form button[type="submit"]');
    this.statusSwitch = page.locator('form [role="switch"]');
  }

  /** Buka webview BOT PPOB NONA lalu arahkan ke halaman Master PSP. */
  static async open(portalPage: Page): Promise<PpobNonaPspPage> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await PpobNonaPspPage.openOnce(portalPage);
      } catch (err) {
        lastError = err as Error;
        await portalPage.waitForTimeout(3000);
      }
    }
    throw lastError;
  }

  private static async openOnce(portalPage: Page): Promise<PpobNonaPspPage> {
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
    const psp = new PpobNonaPspPage(webview);
    await psp.openPspPage();
    return psp;
  }

  async openPspPage() {
    await this.page.goto(WEBVIEW + '/master/psp');
    await expect(this.pspHeading).toBeVisible({ timeout: 15000 });
    await expect(this.addPspButton).toBeVisible({ timeout: 15000 });
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

  async openAddPspForm() {
    await this.addPspButton.click();
    await this.page.locator('form input[name="code"]').waitFor({ state: 'visible', timeout: 10000 });
  }

  async openEditPspForm(keyword: string) {
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

  private async setText(selector: string, value: string) {
    const inp = this.form().locator(selector).first();
    await inp.click();
    await this.page.keyboard.press('ControlOrMeta+A');
    await this.page.keyboard.type(value);
    await this.page.waitForTimeout(400);
  }

  /** Isi text Quill rich-text editor ("Cara Pembayaran / howToPay"). */
  async fillHowToPay(text: string) {
    const ql = this.form().locator('.ql-editor');
    await ql.click();
    await this.page.keyboard.press('ControlOrMeta+A');
    await this.page.keyboard.type(text);
    await this.page.waitForTimeout(600);
  }

  /** Pilih opsi dari dropdown dengan tombol trigger berlabel (mis. 'Pilih Rekening'). */
  async selectDropdown(triggerLabel: string, option: string) {
    await this.form().locator('button', { hasText: triggerLabel }).first().click();
    await this.page.waitForTimeout(1200);
    await this.page.locator('[role="option"]', { hasText: option }).first().click();
    await this.page.waitForTimeout(800);
  }

  async fillForm(data: {
    code?: string;
    type?: string;
    fullName?: string;
    simpleName?: string;
    minAmount?: string;
    maxAmount?: string;
    vaPrefix?: string;
    integratorUrl?: string;
    integratorSecret?: string;
    rekening?: string;
    settlementType?: string;
    howToPay?: string;
  }) {
    if (data.code !== undefined) await this.form().locator('input[name="code"]').fill(data.code);
    if (data.type !== undefined) await this.form().locator('input[name="type"]').fill(data.type);
    if (data.fullName !== undefined) await this.form().locator('input[name="fullName"]').fill(data.fullName);
    if (data.simpleName !== undefined)
      await this.form().locator('input[name="simpleName"]').fill(data.simpleName);
    if (data.minAmount !== undefined) await this.setText('input[placeholder="0"] >> nth=0', data.minAmount);
    if (data.maxAmount !== undefined) await this.setText('input[placeholder="0"] >> nth=1', data.maxAmount);
    if (data.vaPrefix !== undefined) await this.form().locator('input[name="vaPrefix"]').fill(data.vaPrefix);
    if (data.integratorUrl !== undefined)
      await this.form().locator('input[name="integratorUrl"]').fill(data.integratorUrl);
    if (data.integratorSecret !== undefined)
      await this.form().locator('input[name="integratorSecret"]').fill(data.integratorSecret);
    if (data.rekening !== undefined) await this.selectDropdown('Pilih Rekening', data.rekening);
    if (data.settlementType !== undefined)
      await this.selectDropdown('Pilih Tipe Settlement', data.settlementType);
    if (data.howToPay !== undefined) await this.fillHowToPay(data.howToPay);
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
    await this.page.waitForTimeout(3000);
    await expect(this.addPspButton).toBeVisible({ timeout: 10000 });
  }

  // ---------- DELETE ----------

  /**
   * Hapus psp dengan keyword lalu verifikasi hilang di sisi server
   * (reload + cek berulang, karena list bisa menampilkan cache sebelum reload).
   */
  async deletePsp(keyword: string) {
    await this.search(keyword);
    const row = this.rowFor(keyword);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Hapus' }).click();
    await this.page.getByRole('button', { name: 'Lanjutkan' }).click();
    await this.page.waitForTimeout(2000);
    await expect(async () => {
      await this.page.reload();
      await expect(this.pspHeading).toBeVisible({ timeout: 15000 });
      expect(await this.hasRow(keyword)).toBeFalsy();
    }).toPass({ timeout: 30000 });
  }
}