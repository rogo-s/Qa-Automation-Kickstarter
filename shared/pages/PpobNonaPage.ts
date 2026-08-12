import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object - Master Data Role & User pada webview BOT PPOB NONA.
 * Halaman ini dibuka lewat popup (klik "Masuk" BOT PPOB NONA di portal),
 * base URL webview: https://backoffice-ppob-nona-webview-playground.lentera-app.id
 *
 * Perbedaan vs portal:
 *  - Form Role punya matriks permission per modul (select-all + CREATE/DELETE/READ/UPDATE).
 *  - Form User punya field password; email readonly tapi tetap bisa diisi via keyboard.
 *  - Menu baris User hanya "Ubah" (tidak ada Hapus) -> idempotensi via edit baseline.
 *  - Status role & user diganti lewat form Ubah (switch), bukan menu khusus.
 */
const WEBVIEW = 'https://backoffice-ppob-nona-webview-playground.lentera-app.id';

export class PpobNonaPage {
  readonly page: Page;
  readonly roleHeading: Locator;
  readonly userHeading: Locator;
  readonly addRoleButton: Locator;
  readonly addUserButton: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.roleHeading = page.getByRole('heading', { name: 'Daftar Role' });
    this.userHeading = page.getByRole('heading', { name: 'Daftar User' });
    this.addRoleButton = page.getByRole('button', { name: 'Tambah Role' });
    this.addUserButton = page.getByRole('button', { name: 'Tambah User' });
    this.saveButton = page.getByRole('button', { name: 'Simpan' });
  }

  /** Buka webview BOT PPOB NONA lewat portal (klik Masuk di kartu) lalu kembalikan page object webview. */
  static async open(portalPage: Page): Promise<PpobNonaPage> {
    await portalPage.goto('/');
    await portalPage.waitForLoadState('domcontentloaded');
    await portalPage.getByText('Pilih BOT Anda').waitFor({ state: 'visible', timeout: 15000 });
    const card = portalPage.locator('div.p-4.border.rounded-lg', { hasText: 'BOT PPOB NONA' }).first();
    await expect(card).toBeVisible({ timeout: 15000 });
    const popupPromise = portalPage.waitForEvent('popup');
    await card.getByRole('button', { name: 'Masuk' }).click();
    const webview = await popupPromise;
    await webview.waitForLoadState('domcontentloaded');
    await expect(webview).toHaveURL(/backoffice-ppob-nona-webview-playground\.lentera-app\.id\/?$/);
    await webview.waitForTimeout(1500);
    return new PpobNonaPage(webview);
  }

  async goto(path: string) {
    await this.page.goto(WEBVIEW + path);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async openRolePage() {
    await this.goto('/master/role');
    await expect(this.roleHeading).toBeVisible({ timeout: 15000 });
    await expect(this.addRoleButton).toBeVisible({ timeout: 15000 });
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  async openUserPage() {
    await this.goto('/master/user');
    await expect(this.userHeading).toBeVisible({ timeout: 15000 });
    await expect(this.addUserButton).toBeVisible({ timeout: 15000 });
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  // ---------- SEARCH ----------

  private searchInput(): Locator {
    return this.page.locator('main input[placeholder*="Cari"]').first();
  }

  async search(keyword: string) {
    await this.searchInput().fill(keyword);
    await this.page.waitForTimeout(1200);
  }

  rowFor(keyword: string): Locator {
    return this.page.locator('main tbody tr', { hasText: keyword }).first();
  }

  async hasRow(keyword: string): Promise<boolean> {
    await this.search(keyword);
    return (await this.rowFor(keyword).count()) > 0;
  }

  // ---------- STATUS helper ----------

  private statusSwitch(): Locator {
    return this.page.locator('main button[role="switch"]').first();
  }

  /** Set status (aktif/nonaktif) pada form add/edit via switch. */
  async setStatus(wantActive: boolean) {
    const sw = this.statusSwitch();
    const want = wantActive ? 'checked' : 'unchecked';
    if ((await sw.getAttribute('data-state')) !== want) {
      await sw.click({ force: true });
    }
  }

  /** Baca label status di baris tabel (Aktif / Tidak Aktif). */
  statusCell(row: Locator): Locator {
    return row.getByText(/Aktif|Tidak Aktif/);
  }

  // ---------- ROLE ----------

  async openAddRoleForm() {
    await this.addRoleButton.click();
    await this.page.waitForTimeout(800);
    await expect(this.page.locator('input[name="code"]')).toBeVisible({ timeout: 10000 });
  }

  async openEditRoleForm(code: string) {
    await this.search(code);
    const row = this.rowFor(code);
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Ubah' }).click();
    await this.page.waitForTimeout(800);
    await expect(this.page.locator('input[name="code"]')).toBeVisible({ timeout: 10000 });
  }

  async fillRoleForm({
    code,
    name,
    description,
  }: {
    code: string;
    name: string;
    description: string;
  }) {
    await this.page.locator('input[name="code"]').fill(code);
    await this.page.locator('input[name="name"]').fill(name);
    await this.page.locator('textarea[name="description"]').fill(description);
  }

  /** Centang SEMUA permission: klik select-all tiap modul, lalu pastikan semua checkbox checked. */
  async grantAllPermissions() {
    const moduleLabels = this.page.locator('main label').filter({
      has: this.page.locator('button[role="checkbox"]'),
    });
    const n = await moduleLabels.count();
    for (let i = 0; i < n; i++) {
      const cb = moduleLabels.nth(i).locator('button[role="checkbox"]');
      if ((await cb.getAttribute('data-state')) !== 'checked') {
        await cb.click({ force: true });
      }
    }
    await this.page.waitForTimeout(500);

    const cbs = this.page.locator('main button[role="checkbox"]');
    for (let pass = 0; pass < 3; pass++) {
      let all = true;
      for (let i = 0; i < (await cbs.count()); i++) {
        const st = await cbs.nth(i).getAttribute('data-state');
        if (st !== 'checked') {
          all = false;
          await cbs.nth(i).click({ force: true }).catch(() => {});
        }
      }
      if (all) break;
      await this.page.waitForTimeout(400);
    }
  }

  /** Hapus role jika sudah ada & tidak dipakai user. Throw bila masih dipakai data lain. */
  async deleteRoleIfExists(code: string) {
    if (!(await this.hasRow(code))) return;
    const row = this.rowFor(code);
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Hapus' }).click();
    await this.page.getByRole('button', { name: 'Lanjutkan' }).click();
    await this.page.waitForTimeout(1500);
    await expect(this.rowFor(code)).toHaveCount(0, { timeout: 10000 });
  }

  /** Pastikan role ada dengan data baseline: add jika belum ada, edit jika sudah. */
  async ensureRole({
    code,
    name,
    description,
    wantActive = true,
  }: {
    code: string;
    name: string;
    description: string;
    wantActive?: boolean;
  }) {
    if (await this.hasRow(code)) {
      await this.openEditRoleForm(code);
      await this.fillRoleForm({ code, name, description });
      await this.setStatus(wantActive);
      await this.save();
      await this.page.waitForTimeout(1000);
      return 'updated';
    }
    await this.openAddRoleForm();
    await this.fillRoleForm({ code, name, description });
    await this.setStatus(wantActive);
    await this.grantAllPermissions();
    await this.save();
    await this.page.waitForTimeout(1000);
    return 'created';
  }

  // ---------- USER ----------

  async openAddUserForm() {
    await this.addUserButton.click();
    await this.page.waitForTimeout(800);
    await expect(this.page.locator('input[name="fullName"]')).toBeVisible({ timeout: 10000 });
  }

  async openEditUserForm(email: string) {
    await this.search(email);
    const row = this.rowFor(email);
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Ubah' }).click();
    await this.page.waitForTimeout(800);
    await expect(this.page.locator('input[name="fullName"]')).toBeVisible({ timeout: 10000 });
  }

  async fillUserForm({
    fullName,
    email,
    phoneNumber,
    password,
  }: {
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string;
  }) {
    await this.page.locator('input[name="fullName"]').fill(fullName);
    const emailInput = this.page.locator('input[name="email"]');
    if (await emailInput.count()) {
      await emailInput.click();
      await this.page.keyboard.type(email);
    }
    await this.page.locator('input[name="phoneNumber"]').fill(phoneNumber);
    await this.page.locator('input[name="password"]').fill(password);
  }

  /** Pilih role dari dropdown (add: tombol "Pilih role"; edit: tombol nama role saat ini). */
  async selectRole(roleName: string) {
    const roleLabel = this.page.locator('main label', { hasText: /^Role/ }).first();
    const trigger = roleLabel.locator('xpath=../button');
    await trigger.click();
    await this.page.getByRole('option', { name: roleName, exact: true }).click();
  }

  /** Pastikan user ada dengan data baseline: add jika belum ada, edit jika sudah. */
  async ensureUser({
    fullName,
    email,
    phoneNumber,
    password,
    roleName,
    wantActive = true,
  }: {
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string;
    roleName: string;
    wantActive?: boolean;
  }) {
    if (await this.hasRow(email)) {
      await this.openEditUserForm(email);
      await this.page.locator('input[name="fullName"]').fill(fullName);
      await this.page.locator('input[name="phoneNumber"]').fill(phoneNumber);
      await this.selectRole(roleName);
      await this.setStatus(wantActive);
      await this.save();
      await this.page.waitForTimeout(1000);
      return 'updated';
    }
    await this.openAddUserForm();
    await this.fillUserForm({ fullName, email, phoneNumber, password });
    await this.selectRole(roleName);
    await this.setStatus(wantActive);
    await this.save();
    await this.page.waitForTimeout(1000);
    return 'created';
  }

  async save() {
    await this.saveButton.click();
  }
}
