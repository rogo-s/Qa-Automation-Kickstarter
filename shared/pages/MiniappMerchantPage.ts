import { Page, Locator, expect } from '@playwright/test';
import { generateKeyPairSync } from 'node:crypto';

/**
 * Page Object - Merchant Miniapp (onboarding/merchant)
 * Probe 28-08-2026: List 10 rows, no Tambah Merchant untuk role subandonorogo, Detail → Data Merchant Edit form
 * Fields: name, code, email, phoneNumber, address, picName, picEmail, Status Aktif
 * Public key: harus 1024 bits PKCS#8 (SPKI PEM) — generate via crypto.generateKeyPairSync
 */
const WEBVIEW = 'https://miniapps-dashboard-internal-playground.lentera-app.id';

export function generateDummyPublicKey1024(): string {
  const { publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 1024,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  // publicKey is already SPKI PEM (PKCS#8 for public) e.g. -----BEGIN PUBLIC KEY-----\n...
  return publicKey;
}

export class MiniappMerchantPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /Merchant/i }).first();
    this.searchInput = page.locator('main input[placeholder*="Cari"]');
  }

  static async open(portalPage: Page): Promise<MiniappMerchantPage> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await MiniappMerchantPage.openOnce(portalPage);
      } catch (err) {
        lastError = err as Error;
        await portalPage.waitForTimeout(3000);
      }
    }
    throw lastError;
  }

  private static async openOnce(portalPage: Page): Promise<MiniappMerchantPage> {
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
    const merchant = new MiniappMerchantPage(webview);
    await merchant.openList();
    return merchant;
  }

  async openList() {
    await this.page.goto(WEBVIEW + '/onboarding/merchant');
    await expect(this.heading).toBeVisible({ timeout: 15000 });
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  async search(keyword: string) {
    if ((await this.searchInput.count()) === 0) return;
    await this.searchInput.fill(keyword);
    await this.page.waitForTimeout(1200);
  }

  rowFor(keyword: string): Locator {
    return this.page.locator('main tbody tr', { hasText: keyword }).first();
  }

  async hasRow(keyword: string): Promise<boolean> {
    await this.search(keyword);
    const text = await this.page.locator('main tbody').textContent().catch(() => '');
    return !!text && text.includes(keyword);
  }

  table(): Locator {
    return this.page.locator('main table').first();
  }

  // Detail → Edit form
  async openDetail(keyword: string) {
    await this.search(keyword);
    const row = this.rowFor(keyword);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Detail' }).click();
    await this.page.waitForTimeout(1500);
    await expect(this.page.getByText('Detail Merchant').first()).toBeVisible({ timeout: 10000 });
  }

  async openEditFromDetail() {
    await this.page.getByRole('button', { name: 'Edit' }).first().click();
    await this.page.locator('form input[name="name"]').waitFor({ state: 'visible', timeout: 10000 });
  }

  form(): Locator {
    return this.page.locator('form').last();
  }

  async fillMerchantForm(data: {
    name?: string;
    code?: string;
    email?: string;
    phoneNumber?: string;
    address?: string;
    picName?: string;
    picEmail?: string;
    publicKey?: string;
  }) {
    if (data.name !== undefined) await this.form().locator('input[name="name"]').fill(data.name);
    if (data.code !== undefined) await this.form().locator('input[name="code"]').fill(data.code);
    if (data.email !== undefined) await this.form().locator('input[name="email"]').fill(data.email);
    if (data.phoneNumber !== undefined) await this.form().locator('input[name="phoneNumber"]').fill(data.phoneNumber);
    if (data.address !== undefined) await this.form().locator('textarea[name="address"]').fill(data.address);
    if (data.picName !== undefined) await this.form().locator('input[name="picName"]').fill(data.picName);
    if (data.picEmail !== undefined) await this.form().locator('input[name="picEmail"]').fill(data.picEmail);
    if (data.publicKey !== undefined) {
      // public key mungkin hidden textarea atau input name publicKey
      const pkInput = this.form().locator('textarea[name*="public"], input[name*="public"], textarea[name="publicKey"]').first();
      if ((await pkInput.count()) > 0) await pkInput.fill(data.publicKey);
      else {
        // fallback: cari textarea terakhir
        const ta = this.form().locator('textarea').last();
        if ((await ta.count()) > 0) await ta.fill(data.publicKey).catch(() => {});
      }
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

  // Aplikasi & Product (di dalam merchant detail, setelah Edit atau tab)
  // Notes: untuk sekarang, add aplikasi/product via UI belum ditemukan (Tambah Merchant tidak ada untuk role ini)
  // Placeholder: jika nanti ada button "Tambah Aplikasi", pakai method ini
  async openAddAplikasi() {
    const btn = this.page.getByRole('button', { name: /Tambah.*Aplikasi/i }).first();
    await btn.click();
    await this.page.locator('form').waitFor({ state: 'visible', timeout: 10000 });
  }

  async selectProductForAplikasi(product: 'ppob' | 'estove' | 'voucher') {
    // dropdown product di form aplikasi, 3 options: ppob, estove (Kompor Listrik), voucher
    const labelMap: Record<string, string> = {
      ppob: 'PPOB',
      estove: 'Kompor Listrik',
      voucher: 'Voucher',
    };
    const trigger = this.form().locator('button', { hasText: /Product|Produk/ }).first();
    if ((await trigger.count()) === 0) {
      console.log('[TEMUAN] Dropdown Product tidak ditemukan di form aplikasi');
      return;
    }
    await trigger.click();
    await this.page.waitForTimeout(800);
    const opt = this.page.getByRole('option', { name: new RegExp(labelMap[product], 'i') }).first();
    if ((await opt.count()) > 0) await opt.click();
    else await this.page.locator('[role="option"]', { hasText: labelMap[product] }).first().click().catch(() => {});
    await this.page.waitForTimeout(600);
  }

  async fillAplikasiCategoryColor(grading: string) {
    // kategori warna fixed, bebas angka grading color
    const input = this.form().locator('input[name*="category"], input[name*="color"], input[placeholder*="warna" i]').first();
    if ((await input.count()) > 0) await input.fill(grading);
    else {
      // fallback: input kedua di form aplikasi
      const allInputs = this.form().locator('input');
      if ((await allInputs.count()) > 1) await allInputs.nth(1).fill(grading).catch(() => {});
    }
  }
}
