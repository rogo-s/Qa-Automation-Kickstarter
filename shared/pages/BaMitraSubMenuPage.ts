import { Page, Locator, expect } from '@playwright/test';
import { BaPage } from './BaPage';

/**
 * Page Object - Sub-menu Mitra (Top Up, Riwayat, Product Pricing, Credential)
 * pada webview BOT BA. Scope: READ/VIEW dengan data mitra QA yang SUDAH ADA
 * (QAMITRA - QA MITRA TES EDIT), TANPA membuat data baru.
 *
 * Rute (id mitra dinamis, dicari lewat row menu):
 *  - Top Up:           /mitra_internal/topup/<id>?code=...
 *  - Riwayat:          /mitra_internal/history/<id>
 *  - Product Pricing:  /mitra_internal/product-pricing/<id>
 *  - Credential:       /mitra_internal/credential/<id>
 *
 * Karakteristik:
 *  - Semua halaman menampilkan heading judul + "Nama: ..." + "Code: ...".
 *  - Top Up punya tombol "Topup" (aksi tulis - TIDAK dieksekusi di test ini).
 *  - Product Pricing punya tombol "Generate" & "Price" (TIDAK dieksekusi).
 *  - Credential menampilkan Public Key / Auth URL / Callback URL dengan
 *    placeholder "belum tersedia" bila kosong + tombol Salin/Sembunyikan.
 */
export class BaMitraSubMenuPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  private static readonly MITRA_QA_CODE = 'QAMITRA';
  private static readonly MITRA_QA_NAME = 'QA MITRA TES EDIT';

  heading(name: string | RegExp): Locator {
    return this.page.getByRole('heading', { name });
  }

  static async open(
    portalPage: Page,
    submenu: 'Top Up' | 'Riwayat' | 'Product Pricing' | 'Credential',
    mitraCode = 'QAMITRA',
  ): Promise<BaMitraSubMenuPage> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await BaMitraSubMenuPage.openOnce(portalPage, submenu, mitraCode);
      } catch (err) {
        lastError = err as Error;
        await portalPage.waitForTimeout(3000);
      }
    }
    throw lastError;
  }

  private static async openOnce(
    portalPage: Page,
    submenu: 'Top Up' | 'Riwayat' | 'Product Pricing' | 'Credential',
    mitraCode: string,
  ): Promise<BaMitraSubMenuPage> {
    const ba = await BaPage.open(portalPage);
    await ba.openMitra();
    await ba.page.waitForTimeout(2500);

    const row = ba.page.locator('main tbody tr', { hasText: mitraCode }).first();
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await ba.page.waitForTimeout(800);
    await ba.page.getByRole('menuitem', { name: submenu, exact: true }).click();
    await ba.page.waitForTimeout(2500);

    const page = new BaMitraSubMenuPage(ba.page);
    await page.dismissOverlay();
    return page;
  }

  /** Verifikasi identitas mitra tampil di halaman sub-menu (default mitra QA). */
  async expectMitraIdentity(mitraName = 'QA MITRA TES EDIT', mitraCode = 'QAMITRA') {
    await expect(this.page.locator('body')).toContainText(`Nama: ${mitraName}`);
    await expect(this.page.locator('body')).toContainText(`Code: ${mitraCode}`);
  }

  async expectTableHeader(...columns: string[]) {
    const thead = this.page.locator('main table thead');
    await expect(thead).toBeVisible({ timeout: 15000 });
    for (const col of columns) {
      await expect(thead).toContainText(col);
    }
  }

  /** Search "Cari..." pada halaman sub-menu. */
  async search(keyword: string) {
    const input = this.page.locator('main input[placeholder*="Cari"]').first();
    await input.fill(keyword);
    await this.page.waitForTimeout(2500);
  }

  /** Dismiss overlay radix yang kadang tertinggal setelah aksi. */
  async dismissOverlay() {
    for (let i = 0; i < 3; i++) {
      const ov = this.page.locator('div.fixed.inset-0[data-state="open"]').first();
      if (await ov.count()) {
        await ov.click({ position: { x: 5, y: 5 }, force: true }).catch(() => {});
        await this.page.waitForTimeout(600);
      } else break;
    }
    await this.page.keyboard.press('Escape').catch(() => {});
    await this.page.waitForTimeout(500);
  }

  // ---------- AKSI TOP UP ----------

  async openTopupForm() {
    await this.page.getByRole('button', { name: 'Topup' }).first().click();
    const dlg = this.page.locator('[role="dialog"]').last();
    await expect(dlg.locator('h2').first()).toContainText('Melakukan Topup', { timeout: 10000 });
  }

  topupDialog(): Locator {
    return this.page
      .locator('[role="dialog"]')
      .filter({ has: this.page.locator('h2', { hasText: 'Melakukan Topup' }) })
      .first();
  }

  isTopupDisabled(): Promise<boolean> {
    return this.topupDialog().locator('button[type="submit"]').isDisabled();
  }

  /** Pilih bank (penerima/pengirim) pada dialog Topup. Dipanggil 2x. */
  async pickTopupBank(keyword: string) {
    const picker = this.topupDialog().locator('button').filter({ hasText: 'Pilih bank' }).first();
    await picker.click();
    await this.page.waitForTimeout(1200);
    await this.page.locator('[role="option"]:visible').filter({ hasText: keyword }).first().click();
    await this.page.waitForTimeout(1000);
  }

  async fillTopupForm(data: { jumlah?: string; norek?: string; nama?: string; tanggal?: string; deskripsi?: string }) {
    const dlg = this.topupDialog();
    if (data.jumlah !== undefined) await dlg.locator('input[placeholder="Masukan jumlah top-up"]').fill(data.jumlah);
    if (data.norek !== undefined) await dlg.locator('input[name="senderAccountNumber"]').fill(data.norek);
    if (data.nama !== undefined) await dlg.locator('input[name="senderName"]').fill(data.nama);
    if (data.tanggal !== undefined) await dlg.locator('input[name="transferDateTime"]').fill(data.tanggal);
    if (data.deskripsi !== undefined) await dlg.locator('textarea').fill(data.deskripsi);
    await this.page.waitForTimeout(500);
  }

  /** Submit topup; sukses = dialog tertutup. */
  async submitTopup() {
    await expect(this.topupDialog().locator('button[type="submit"]')).toBeEnabled({ timeout: 10000 });
    await this.topupDialog().locator('button[type="submit"]').click();
    await expect(this.topupDialog()).toHaveCount(0, { timeout: 15000 });
    await this.page.waitForTimeout(2000);
  }

  // ---------- AKSI PRODUCT PRICING (mitra DIGI01) ----------

  async clickGeneratePricing() {
    await this.page.getByRole('button', { name: 'Generate' }).first().click();
    await this.page.waitForTimeout(3000);
    await this.dismissOverlay();
  }

  async clickAddPrice() {
    await this.dismissOverlay();
    await this.page.locator('main button').filter({ hasText: 'Price' }).first().click();
    await this.page.waitForTimeout(1500);
  }

  priceDialog(): Locator {
    return this.page
      .locator('[role="dialog"]')
      .filter({ has: this.page.locator('h2', { hasText: 'Tambahkan Fee Pricing' }) })
      .first();
  }

  /** Pilih product pada dialog Fee Pricing: opsi PERTAMA yang tidak disabled. */
  async pickProduct() {
    await this.priceDialog().locator('button').filter({ hasText: 'Pilih product' }).first().click();
    await this.page.waitForTimeout(1200);
    const options = this.page.locator('[role="option"]:visible');
    const n = await options.count();
    for (let i = 0; i < n; i++) {
      const opt = options.nth(i);
      if ((await opt.getAttribute('aria-disabled')) !== 'true') {
        await opt.click();
        await this.page.waitForTimeout(1000);
        return;
      }
    }
    throw new Error('Tidak ada opsi product yang enabled di picker');
  }

  /** Isi fee pricing; field disabled (mis. Harga utk produk BILLING) dilewati. */
  async fillPriceForm(data: { biayaAdmin?: string; komisi?: string; harga?: string }) {
    const dlg = this.priceDialog();
    const fields: [string | undefined, string][] = [
      [data.biayaAdmin, 'Masukan biaya admin'],
      [data.komisi, 'Masukan komisi'],
      [data.harga, 'Masukan harga'],
    ];
    for (const [value, placeholder] of fields) {
      if (value === undefined) continue;
      const input = dlg.locator(`input[placeholder="${placeholder}"]`);
      if (!(await input.isDisabled())) {
        await input.fill(value);
        await this.page.waitForTimeout(300);
      }
    }
    await this.page.waitForTimeout(500);
  }

  isPriceDisabled(): Promise<boolean> {
    return this.priceDialog().locator('button[type="submit"]').isDisabled();
  }

  async savePrice() {
    await expect(this.priceDialog().locator('button[type="submit"]')).toBeEnabled({ timeout: 10000 });
    await this.priceDialog().locator('button[type="submit"]').click();
    await this.page.waitForTimeout(3000);
  }

  async closePrice() {
    await this.priceDialog().locator('button').last().click();
    await this.page.waitForTimeout(1200);
  }

  /** Hapus baris pricing (menu baris -> Hapus -> konfirmasi Lanjutkan). */
  async deletePricingRow(keyword: string) {
    const row = this.page.locator('main tbody tr', { hasText: keyword }).first();
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.locator('button', { hasText: 'Open menu' }).first().click();
    await this.page.waitForTimeout(800);
    await this.page.getByRole('menuitem', { name: 'Hapus' }).click();
    const confirm = this.page.locator('[role="alertdialog"]').first();
    await expect(confirm).toBeVisible({ timeout: 10000 });
    await confirm.getByRole('button', { name: 'Lanjutkan' }).click();
    await this.page.waitForTimeout(3000);
  }
}
