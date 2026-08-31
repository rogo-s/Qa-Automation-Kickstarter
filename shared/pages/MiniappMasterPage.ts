import { Page, Locator, expect } from '@playwright/test';

/**
 * Generic Page Object - Master Miniapp (13 routes valid, 1 404)
 * Base: https://miniapps-dashboard-internal-playground.lentera-app.id
 *
 * Probe direct goto 28-08-2026:
 *  - manage-bank: Bank, Cari Bank, 6 rows, menu Edit|Edit Fee Bank|Hapus, no Tambah
 *  - template-product: Template, 3 rows, Ubah|Hapus, no Tambah
 *  - role: Role, Cari Role, 6 rows, Ubah|Hapus
 *  - user: List User, Cari User, Tambah User, 10 rows, Ubah|Detail, form fullName/email/phone/password
 *  - banner: Banner, Tambah Banner, 6 rows, Ubah|Hapus, form title/sequence/description/actionUrl + file
 *  - payment-gateway: Payment Gateway, Tambah, 6 rows, Ubah, form code/name/description
 *  - menu: Menu, Cari Menu, 10 rows, Ubah|Hapus
 *  - payment-method: Metode Pembayaran, Tambah, 10 rows, Ubah, form code/name/maxLengthVA
 *  - product-ppob: Produk PPOB, Cari Produk PPOB, 10 rows, Ubah|Hapus
 *  - ppob: PPOB Group, Cari Grup PPOB, Tambah PPOB, 10 rows, Ubah|Hapus, form groupCode/name/providerName/providerCode
 *  - settlement-bank: Settlement Bank, Cari settlement, 2 rows, Edit|Hapus
 *  - product-microsite: Produk Microsite, 3 rows, Ubah
 *  - prefix-number: Nomor Prefix, Cari Awalan Nomor, Tambah Nomor Prefix, 10 rows, Ubah|Hapus, form phonePrefix
 *  - 017: 404
 *
 * Pola: view (search+rows+menu), validasi (Simpan disabled), ADD (search dulu kalau tidak ada -> add -> hasRow), Edit, Delete (cleanup biar tidak sampah)
 */
const WEBVIEW = 'https://miniapps-dashboard-internal-playground.lentera-app.id';

export type MiniappMasterConfig = {
  route: string;
  heading: string;
  searchPlaceholder?: string;
  addButtonName?: string; // exact or regex; undefined = no Tambah
  tableExpected?: number; // min rows
  menuItems: string[]; // e.g. ['Ubah','Hapus']
};

export const MINIAPP_MASTERS: Record<string, MiniappMasterConfig> = {
  'manage-bank': {
    route: '/master/manage-bank',
    heading: 'Bank',
    searchPlaceholder: 'Cari Bank',
    // no Tambah
    menuItems: ['Edit', 'Hapus'],
  },
  'template-product': {
    route: '/master/template-product',
    heading: 'Template',
    menuItems: ['Ubah', 'Hapus'],
  },
  role: {
    route: '/master/role',
    heading: 'Role',
    searchPlaceholder: 'Cari Role',
    menuItems: ['Ubah', 'Hapus'],
  },
  user: {
    route: '/master/user',
    heading: 'List User',
    searchPlaceholder: 'Cari User',
    addButtonName: 'Tambah User',
    menuItems: ['Ubah', 'Detail'],
  },
  banner: {
    route: '/master/banner',
    heading: 'Banner',
    addButtonName: 'Tambah Banner',
    menuItems: ['Ubah', 'Hapus'],
  },
  'payment-gateway': {
    route: '/master/payment-gateway',
    heading: 'Payment Gateway',
    addButtonName: 'Tambah',
    menuItems: ['Ubah'],
  },
  menu: {
    route: '/master/menu',
    heading: 'Menu',
    searchPlaceholder: 'Cari Menu',
    menuItems: ['Ubah', 'Hapus'],
  },
  'payment-method': {
    route: '/master/payment-method',
    heading: 'Metode Pembayaran',
    addButtonName: 'Tambah',
    menuItems: ['Ubah'],
  },
  'product-ppob': {
    route: '/master/product-ppob',
    heading: 'Produk PPOB',
    searchPlaceholder: 'Cari Produk PPOB',
    menuItems: ['Ubah', 'Hapus'],
  },
  ppob: {
    route: '/master/ppob',
    heading: 'PPOB Group',
    searchPlaceholder: 'Cari Grup PPOB',
    addButtonName: 'Tambah PPOB',
    menuItems: ['Ubah', 'Hapus'],
  },
  'settlement-bank': {
    route: '/master/settlement-bank',
    heading: 'Settlement Bank',
    searchPlaceholder: 'Cari settlement',
    menuItems: ['Edit', 'Hapus'],
  },
  'product-microsite': {
    route: '/master/product-microsite',
    heading: 'Produk Microsite',
    menuItems: ['Ubah'],
  },
  'prefix-number': {
    route: '/master/prefix-number',
    heading: 'Nomor Prefix',
    searchPlaceholder: 'Cari Awalan Nomor',
    addButtonName: 'Tambah Nomor Prefix',
    menuItems: ['Ubah', 'Hapus'],
  },
};

export class MiniappMasterPage {
  readonly page: Page;
  readonly config: MiniappMasterConfig;

  constructor(page: Page, config: MiniappMasterConfig) {
    this.page = page;
    this.config = config;
  }

  static async open(portalPage: Page, masterKey: string): Promise<MiniappMasterPage> {
    const cfg = MINIAPP_MASTERS[masterKey];
    if (!cfg) throw new Error(`Unknown master ${masterKey}`);
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await MiniappMasterPage.openOnce(portalPage, cfg);
      } catch (err) {
        lastError = err as Error;
        await portalPage.waitForTimeout(3000);
      }
    }
    throw lastError;
  }

  private static async openOnce(portalPage: Page, cfg: MiniappMasterConfig): Promise<MiniappMasterPage> {
    await portalPage.goto('/');
    await portalPage.waitForLoadState('domcontentloaded');
    await portalPage.getByText('Pilih BOT Anda').waitFor({ state: 'visible', timeout: 15000 });
    const card = portalPage.locator('div.p-4.border.rounded-lg', { hasText: 'BOT Miniapp' }).first();
    await expect(card).toBeVisible({ timeout: 15000 });
    const popupPromise = portalPage.waitForEvent('popup', { timeout: 20000 });
    await card.getByRole('button', { name: 'Masuk' }).click();
    const webview = await popupPromise;
    await webview.waitForLoadState('domcontentloaded');
    await webview.waitForURL(/miniapps-dashboard-internal-playground.*\/dashboard/, { timeout: 30000 });
    await webview.waitForTimeout(1500);
    const master = new MiniappMasterPage(webview, cfg);
    await master.openPage();
    return master;
  }

  async openPage() {
    await this.page.goto(WEBVIEW + this.config.route);
    await expect(this.page.getByRole('heading', { name: new RegExp(this.config.heading, 'i') }).first()).toBeVisible({
      timeout: 15000,
    });
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  headingLoc(): Locator {
    return this.page.getByRole('heading', { name: new RegExp(this.config.heading, 'i') }).first();
  }

  searchInput(): Locator {
    if (this.config.searchPlaceholder) {
      return this.page.locator(`main input[placeholder*="${this.config.searchPlaceholder.replace(/Cari\s*/, '')}"]`).first();
    }
    return this.page.locator('main input[placeholder*="Cari"]').first();
  }

  async search(keyword: string) {
    const input = this.searchInput();
    if ((await input.count()) === 0) return;
    await input.fill(keyword);
    await this.page.waitForTimeout(1200);
  }

  rowFor(keyword: string): Locator {
    return this.page.locator('main tbody tr', { hasText: keyword }).first();
  }

  async hasRow(keyword: string): Promise<boolean> {
    if (this.config.searchPlaceholder) await this.search(keyword);
    else {
      // fallback: cek tanpa search jika tidak ada input
      await this.page.waitForTimeout(500);
    }
    const text = await this.page.locator('main tbody').textContent().catch(() => '');
    return !!text && text.includes(keyword);
  }

  table(): Locator {
    return this.page.locator('main table').first();
  }

  async rowCount(): Promise<number> {
    return this.page.locator('main tbody tr').count();
  }

  // ---------- ADD FORM ----------
  addButton(): Locator {
    if (!this.config.addButtonName) return this.page.locator('no-add');
    return this.page.getByRole('button', { name: new RegExp(this.config.addButtonName, 'i') }).first();
  }

  async hasAddButton(): Promise<boolean> {
    if (!this.config.addButtonName) return false;
    return (await this.addButton().count()) > 0 && (await this.addButton().isVisible().catch(() => false));
  }

  async openAddForm() {
    await this.addButton().click();
    await this.page.locator('form').waitFor({ state: 'visible', timeout: 10000 });
  }

  form(): Locator {
    return this.page.locator('form').last();
  }

  async fillFormByPlaceholder(data: Record<string, string>) {
    for (const [name, value] of Object.entries(data)) {
      const input = this.form().locator(`input[name="${name}"], textarea[name="${name}"]`).first();
      if ((await input.count()) > 0) await input.fill(value);
      else {
        // fallback by placeholder
        const phInput = this.form().locator(`input[placeholder*="${name}"]`).first();
        if ((await phInput.count()) > 0) await phInput.fill(value);
      }
    }
    await this.page.waitForTimeout(500);
  }

  saveButton(): Locator {
    return this.page.locator('form button[type="submit"]').first();
  }

  async isSaveDisabled(): Promise<boolean> {
    return this.saveButton().isDisabled().catch(() => false);
  }

  async save() {
    await this.saveButton().click();
    await this.page.waitForTimeout(2000);
  }

  async cancelAdd() {
    const cancel = this.page.getByRole('button', { name: /Batal|Cancel/i }).first();
    if ((await cancel.count()) > 0) await cancel.click().catch(() => {});
    else await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(800);
  }

  // ---------- ROW MENU ----------
  async openRowMenu(keyword: string) {
    const row = this.rowFor(keyword);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menu').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  }

  async clickMenuItem(name: string | RegExp) {
    await this.page.getByRole('menuitem', { name }).click();
    await this.page.waitForTimeout(800);
  }

  async deleteRow(keyword: string) {
    await this.openRowMenu(keyword);
    await this.clickMenuItem(/Hapus|Delete/);
    // confirm dialog Batal/Lanjutkan
    const confirm = this.page.getByRole('button', { name: /Lanjutkan|Hapus|Ya/i }).last();
    if ((await confirm.count()) > 0) await confirm.click().catch(() => {});
    await this.page.waitForTimeout(1500);
  }
}
