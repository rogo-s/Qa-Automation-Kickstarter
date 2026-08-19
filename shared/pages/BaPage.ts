import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object - BOT BA (Biller Aggregator), webview Dashboard Internal.
 * Halaman dibuka lewat popup (klik "Masuk" kartu Biller Aggregator di portal),
 * base URL webview: https://biller-dashboard-internal-playground.lentera-app.id
 *
 * Catatan teknis (hasil probe dashboard):
 *  - Sidebar shadcn TANPA data-sidebar; grup menu (Master/Transaksi/Rekonsiliasi)
 *    bersifat collapsible dan submenu TIDAK dirender sebelum grup diekspansi.
 *  - Menu top-level: Dashboard (/dashboard_internal), Invoice (/invoice_internal).
 *  - Setiap halaman: heading h1 + tabel + filter dropdown + pagination "10".
 *
 * Fase 1: spec per menu hanya "buka halaman" (heading + tabel + elemen kunci).
 * Fase 2: CRUD/aksi per menu -> POM khusus per modul (BaXxxPage.ts).
 */
const WEBVIEW = 'https://biller-dashboard-internal-playground.lentera-app.id';

/** Grup sidebar yang menaungi tiap route (top-level = tanpa grup). */
const ROUTE_GROUPS: Record<string, string> = {
  '/billing_provider_internal': 'Master',
  '/menu_internal': 'Master',
  '/mitra_internal': 'Master',
  '/manage_role_internal': 'Master',
  '/manage_user_internal': 'Master',
  '/manage_product_internal': 'Master',
  '/bank_internal': 'Master',
  '/category_group_internal': 'Master',
  '/topup_bank_account_internal': 'Master',
  '/rekap_internal': 'Transaksi',
  '/monitoring_internal': 'Transaksi',
  '/rekonsiliasi_goto_internal': 'Rekonsiliasi',
  '/rekonsiliasi_kudo_internal': 'Rekonsiliasi',
  '/rekonsiliasi_e2pay_internal': 'Rekonsiliasi',
  '/rekon_ayoconnect_internal': 'Rekonsiliasi',
};

export class BaPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Buka webview BA lewat portal (klik Masuk di kartu) lalu kembalikan page object. */
  static async open(portalPage: Page): Promise<BaPage> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await BaPage.openOnce(portalPage);
      } catch (err) {
        lastError = err as Error;
        await portalPage.waitForTimeout(3000);
      }
    }
    throw lastError;
  }

  private static async openOnce(portalPage: Page): Promise<BaPage> {
    await portalPage.goto('/');
    await portalPage.waitForLoadState('domcontentloaded');
    await portalPage.getByText('Pilih BOT Anda').waitFor({ state: 'visible', timeout: 15000 });
    const card = portalPage.locator('div.p-4.border.rounded-lg', { hasText: 'Biller Aggregator' }).first();
    await expect(card).toBeVisible({ timeout: 15000 });
    const popupPromise = portalPage.waitForEvent('popup', { timeout: 20000 });
    await card.getByRole('button', { name: 'Masuk' }).click();
    const webview = await popupPromise;
    await webview.waitForLoadState('domcontentloaded');
    // Popup mendarat di /sso/callback?jwt_token=... lalu di-redirect ke dashboard.
    await webview.waitForURL(/biller-dashboard-internal-playground\.lentera-app\.id\/dashboard_internal/, {
      timeout: 30000,
    });
    await webview.waitForTimeout(1500);
    return new BaPage(webview);
  }

  /** Ekspansi grup sidebar (Master/Transaksi/Rekonsiliasi). Dipanggil hanya saat submenu belum dirender. */
  async expandGroup(name: string) {
    const groupBtn = this.page
      .locator('li.group\\/menu-item')
      .filter({ hasText: name })
      .locator('button')
      .first();
    await expect(groupBtn).toBeVisible({ timeout: 15000 });
    await groupBtn.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Buka halaman menu lewat klik link sidebar (bukan goto), ekspansi grup bila perlu.
   * Menunggu heading h1 target muncul sebagai tanda navigasi sukses.
   */
  async openViaSidebar(route: string, heading: string | RegExp) {
    let link = this.page.locator(`a[href="${route}"]`).first();
    if ((await link.count()) === 0) {
      const group = ROUTE_GROUPS[route];
      if (group) await this.expandGroup(group);
    }
    await expect(link).toBeVisible({ timeout: 15000 });
    await link.click();
    await this.page.waitForTimeout(1500);
    await expect(this.page.getByRole('heading', { name: heading })).toBeVisible({ timeout: 15000 });
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  // ---------- SHARED ----------

  heading(name: string | RegExp): Locator {
    return this.page.getByRole('heading', { name });
  }

  table(): Locator {
    return this.page.locator('main table').first();
  }

  /** Pastikan header kolom tabel berisi teks yang diharapkan. */
  async expectTableHeader(...columns: string[]) {
    const thead = this.table().locator('thead');
    await expect(thead).toBeVisible({ timeout: 15000 });
    for (const col of columns) {
      await expect(thead).toContainText(col);
    }
  }

  /**
   * Kontrol filter halaman: shadcn Select dirender sebagai button role="combobox"
   * (mis. "Pilih Status"), filter lain berupa button biasa. Helper ini menangani keduanya.
   * Catatan: name-matching getByRole tidak bekerja untuk combobox radix-vue,
   * jadi combobox dicari lewat hasText.
   */
  filterControl(name: string): Locator {
    return this.page
      .locator('main [role="combobox"]', { hasText: name })
      .or(this.page.getByRole('button', { name }));
  }

  // ---------- PER MENU (fase 1: buka halaman) ----------

  async openDashboard() {
    await this.openViaSidebar('/dashboard_internal', /Selamat Datang/);
  }

  async openInvoice() {
    await this.openViaSidebar('/invoice_internal', 'Invoice');
  }

  async openBillingProviders() {
    await this.openViaSidebar('/billing_provider_internal', 'Billing Providers');
  }

  async openMenu() {
    await this.openViaSidebar('/menu_internal', 'Menu');
  }

  async openMitra() {
    await this.openViaSidebar('/mitra_internal', 'Mitra');
  }

  async openRole() {
    await this.openViaSidebar('/manage_role_internal', 'Role');
  }

  async openUser() {
    await this.openViaSidebar('/manage_user_internal', 'List User');
  }

  async openProduct() {
    await this.openViaSidebar('/manage_product_internal', 'Produk');
  }

  async openBank() {
    await this.openViaSidebar('/bank_internal', 'Bank');
  }

  async openCategoryGroup() {
    await this.openViaSidebar('/category_group_internal', 'Kategori dan Grup');
  }

  async openTopupBankAccount() {
    await this.openViaSidebar('/topup_bank_account_internal', 'Topup Bank Account');
  }

  async openRekap() {
    await this.openViaSidebar('/rekap_internal', 'Rekap Transaksi');
  }

  async openMonitoring() {
    await this.openViaSidebar('/monitoring_internal', 'Informasi Transaksi');
  }

  async openRekonsiliasiGoto() {
    await this.openViaSidebar('/rekonsiliasi_goto_internal', 'Rekonsiliasi Goto');
  }

  async openRekonsiliasiKudo() {
    await this.openViaSidebar('/rekonsiliasi_kudo_internal', 'Rekonsiliasi Kudo');
  }

  async openRekonsiliasiE2Pay() {
    await this.openViaSidebar('/rekonsiliasi_e2pay_internal', 'Rekonsiliasi E2Pay');
  }

  async openRekonsiliasiAyoConnect() {
    await this.openViaSidebar('/rekon_ayoconnect_internal', 'Rekonsiliasi AyoConnect');
  }
}
