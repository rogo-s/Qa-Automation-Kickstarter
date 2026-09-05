import { Page, Locator, expect } from '@playwright/test';

/**
 * Generic Page Object - Master PGINT (8 routes)
 * Base: https://backoffice-pg-playground.lentera-app.id
 * Probe 28-08-2026: semua Tambah 0 untuk role subandonorogo (view-only), jadi hanya view/search/edit/delete
 * Master: payment-provider, user, merchant, bank, role, action, menu, settlement-bank-account
 */
const WEBVIEW = 'https://backoffice-pg-playground.lentera-app.id';

export type PgintMasterConfig = {
  route: string;
  heading: string;
  searchPlaceholder?: string;
  menuItems: string[];
  formFields?: string[]; // for edit validation
};

export const PGINT_MASTERS: Record<string, PgintMasterConfig> = {
  'payment-provider': {
    route: '/master/payment-provider',
    heading: 'Payment Service Provider',
    searchPlaceholder: 'Cari Psp',
    menuItems: ['Detail', 'Ubah'],
    formFields: ['fullName', 'simpleName', 'code', 'address'],
  },
  user: {
    route: '/master/user',
    heading: 'List User',
    searchPlaceholder: 'Cari User',
    menuItems: ['Ubah', 'Detail'],
    formFields: ['fullName', 'phone', 'maxLoginSession'],
  },
  merchant: {
    route: '/master/merchant',
    heading: 'Merchant',
    searchPlaceholder: 'Cari Merchant',
    menuItems: ['Ubah', 'Detail'],
    formFields: ['fullName', 'address', 'businessType'],
  },
  bank: {
    route: '/master/bank',
    heading: 'List Bank',
    searchPlaceholder: 'Cari Bank',
    menuItems: ['Ubah', 'Delete'],
    formFields: ['name', 'code', 'short_name', 'swift_code'],
  },
  role: {
    route: '/master/role',
    heading: 'Role',
    searchPlaceholder: 'Cari Role',
    menuItems: ['Ubah', 'Hapus'],
    formFields: ['name', 'description'],
  },
  action: {
    route: '/master/action',
    heading: 'Action',
    searchPlaceholder: 'Cari Action',
    menuItems: ['Ubah', 'Hapus'],
    formFields: ['name', 'prefix'],
  },
  menu: {
    route: '/master/menu',
    heading: 'Menu',
    searchPlaceholder: 'Cari Menu',
    menuItems: ['Ubah', 'Hapus'],
    formFields: ['title', 'code', 'icon'],
  },
  'settlement-bank-account': {
    route: '/master/settlement-bank-account',
    heading: 'Settlement Bank Account',
    searchPlaceholder: 'Cari Bank Account',
    menuItems: ['Ubah', 'Hapus'],
    formFields: ['account_name', 'account_number', 'description'],
  },
};

export class PgintMasterPage {
  readonly page: Page;
  readonly config: PgintMasterConfig;

  constructor(page: Page, config: PgintMasterConfig) {
    this.page = page;
    this.config = config;
  }

  static async open(portalPage: Page, key: string): Promise<PgintMasterPage> {
    const cfg = PGINT_MASTERS[key];
    if (!cfg) throw new Error(`Unknown pgint master ${key}`);
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await PgintMasterPage.openOnce(portalPage, cfg);
      } catch (err) {
        lastError = err as Error;
        await portalPage.waitForTimeout(3000);
      }
    }
    throw lastError;
  }

  private static async openOnce(portalPage: Page, cfg: PgintMasterConfig): Promise<PgintMasterPage> {
    await portalPage.goto('/');
    await portalPage.waitForLoadState('domcontentloaded');
    await portalPage.getByText('Pilih BOT Anda').waitFor({ state: 'visible', timeout: 15000 });
    const card = portalPage.locator('div.p-4.border.rounded-lg', { hasText: 'PGINT' }).first();
    let target = card;
    if (!(await card.isVisible().catch(() => false))) {
      const all = portalPage.locator('div.p-4.border.rounded-lg');
      for (let i = 0; i < (await all.count()); i++) {
        const txt = await all.nth(i).innerText();
        if (txt.includes('PGINT') || txt.includes('Payment Gateway')) {
          target = all.nth(i);
          break;
        }
      }
    }
    await expect(target).toBeVisible({ timeout: 15000 });
    const popupPromise = portalPage.waitForEvent('popup', { timeout: 20000 });
    await target.getByRole('button', { name: 'Masuk' }).click();
    const webview = await popupPromise;
    await webview.waitForLoadState('domcontentloaded');
    await webview.waitForTimeout(1500);
    const pg = new PgintMasterPage(webview, cfg);
    await pg.openPage();
    return pg;
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
    return this.page.locator(`main input[placeholder*="${this.config.searchPlaceholder?.replace('Cari ', '') || 'Cari'}"]`).first();
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
    const text = await this.page.locator('main tbody').textContent().catch(() => '');
    return !!text && text.includes(keyword);
  }

  table(): Locator {
    return this.page.locator('main table').first();
  }

  async rowCount(): Promise<number> {
    return this.page.locator('main tbody tr').count();
  }

  // No Tambah for this role — view only, but keep method for completeness (will be no-op)
  async hasAddButton(): Promise<boolean> {
    return (await this.page.getByRole('button', { name: /Tambah/ }).count()) > 0;
  }

  form(): Locator {
    return this.page.locator('form').last();
  }

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

  async fillFormByName(data: Record<string, string>) {
    for (const [name, value] of Object.entries(data)) {
      const input = this.form().locator(`input[name="${name}"], textarea[name="${name}"]`).first();
      if ((await input.count()) > 0) await input.fill(value);
    }
    await this.page.waitForTimeout(500);
  }

  saveButton(): Locator {
    return this.page.locator('form button[type="submit"]').first();
  }

  async save() {
    await this.saveButton().click();
    await this.page.waitForTimeout(2000);
  }

  async cancel() {
    const cancel = this.page.getByRole('button', { name: /Batal|Kembali/ }).first();
    if ((await cancel.count()) > 0) await cancel.click().catch(() => {});
    else await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(800);
  }
}
