import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object - Monitoring Miniapp (4 routes)
 * Probe 28-08-2026:
 *  - transaction-ppob: Informasi Transaksi PPOB, Cari..., Pilih Tanggal, Export, 10 rows
 *  - monitoring-payment: Informasi Pembayaran, Cari Payment ID, Pilih Tanggal Pembayaran, Export
 *  - transaction-voucher: Informasi Transaksi Voucher, Cari..., Pilih Tanggal, Export
 *  - transaction-e-stove: Informasi Transaksi Kompor Listrik, Cari..., Pilih Tanggal, Export
 * Semua view only: search, date picker, export XLSX
 */
const WEBVIEW = 'https://miniapps-dashboard-internal-playground.lentera-app.id';

export type MonitoringConfig = {
  route: string;
  heading: string;
  searchPlaceholder: string;
};

export const MONITORING_CONFIGS: Record<string, MonitoringConfig> = {
  'transaction-ppob': {
    route: '/monitoring/transaction-ppob',
    heading: 'Informasi Transaksi PPOB',
    searchPlaceholder: 'Cari',
  },
  'monitoring-payment': {
    route: '/monitoring/monitoring-payment',
    heading: 'Informasi Pembayaran',
    searchPlaceholder: 'Cari Payment ID',
  },
  'transaction-voucher': {
    route: '/monitoring/transaction-voucher',
    heading: 'Informasi Transaksi Voucher',
    searchPlaceholder: 'Cari',
  },
  'transaction-e-stove': {
    route: '/monitoring/transaction-e-stove',
    heading: 'Informasi Transaksi Kompor Listrik',
    searchPlaceholder: 'Cari',
  },
};

export class MiniappMonitoringPage {
  readonly page: Page;
  readonly config: MonitoringConfig;

  constructor(page: Page, config: MonitoringConfig) {
    this.page = page;
    this.config = config;
  }

  static async open(portalPage: Page, key: string): Promise<MiniappMonitoringPage> {
    const cfg = MONITORING_CONFIGS[key];
    if (!cfg) throw new Error(`Unknown monitoring ${key}`);
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await MiniappMonitoringPage.openOnce(portalPage, cfg);
      } catch (err) {
        lastError = err as Error;
        await portalPage.waitForTimeout(3000);
      }
    }
    throw lastError;
  }

  private static async openOnce(portalPage: Page, cfg: MonitoringConfig): Promise<MiniappMonitoringPage> {
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
    const mon = new MiniappMonitoringPage(webview, cfg);
    await mon.openPage();
    return mon;
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
    return this.page.locator(`main input[placeholder*="${this.config.searchPlaceholder}"]`).first();
  }

  async search(keyword: string) {
    await this.searchInput().fill(keyword);
    await this.page.waitForTimeout(1200);
  }

  table(): Locator {
    return this.page.locator('main table').first();
  }

  async rowCount(): Promise<number> {
    return this.page.locator('main tbody tr').count();
  }

  async openDatePicker() {
    const btn = this.page.getByRole('button', { name: /Pilih Tanggal/ }).first();
    await btn.click();
    await this.page.getByRole('dialog').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await this.page.waitForTimeout(800);
  }

  async exportFile(): Promise<void> {
    const btn = this.page.getByRole('button', { name: 'Export' }).first();
    await expect(btn).toBeVisible({ timeout: 10000 });
    // click triggers download; caller should handle waitForEvent('download') if needed
    await btn.click();
    await this.page.waitForTimeout(1500);
  }
}
