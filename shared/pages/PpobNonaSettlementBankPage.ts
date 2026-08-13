import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object - Master Data Settlement Bank Account pada webview BOT PPOB NONA.
 * Halaman dibuka lewat popup (klik "Masuk" BOT PPOB NONA di portal).
 *
 * Karakteristik menu Settlement Bank Account:
 *  - Heading h1 "Master Settlement Bank Account".
 *  - HANYA fitur pencarian (input#search "Cari Bank..."); TIDAK ada tombol
 *    tambah/filter dan tidak ada row action (menu bersifat read-only).
 *  - Pencarian cocok dengan nama akun maupun nama bank (mis. "bni" -> BANK BNI
 *    JAKARTA, "mandiri" -> Bank Mandiri). Search kosong = semua data.
 *  - Kolom: Akun, Nama Bank, Dibuat, Diperbarui.
 */
const WEBVIEW = 'https://backoffice-ppob-nona-webview-playground.lentera-app.id';

export class PpobNonaSettlementBankPage {
  readonly page: Page;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Master Settlement Bank Account' });
  }

  /** Buka webview BOT PPOB NONA lalu arahkan ke halaman Settlement Bank Account. */
  static async open(portalPage: Page): Promise<PpobNonaSettlementBankPage> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await PpobNonaSettlementBankPage.openOnce(portalPage);
      } catch (err) {
        lastError = err as Error;
        await portalPage.waitForTimeout(3000);
      }
    }
    throw lastError;
  }

  private static async openOnce(portalPage: Page): Promise<PpobNonaSettlementBankPage> {
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
    const page = new PpobNonaSettlementBankPage(webview);
    await page.openPage();
    return page;
  }

  async openPage() {
    await this.page.goto(WEBVIEW + '/master/settlement-bank-account');
    await expect(this.heading).toBeVisible({ timeout: 15000 });
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

  /** Jumlah baris hasil yang tampil (tidak termasuk baris kosong "Tidak ada data"). */
  async rowCount(): Promise<number> {
    const text = await this.page.locator('main tbody').textContent().catch(() => '');
    if (!text || text.includes('Tidak ada data')) return 0;
    return this.page.locator('main tbody tr').count();
  }

  /** True bila search menampilkan baris yang memuat keyword tsb. */
  async hasRow(keyword: string): Promise<boolean> {
    await this.search(keyword);
    const text = await this.page.locator('main tbody').textContent().catch(() => '');
    return !!text && text.includes(keyword);
  }
}