import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object - Master Data Cutoff pada webview BOT PPOB NONA.
 * Halaman dibuka lewat popup (klik "Masuk" BOT PPOB NONA di portal).
 *
 * Karakteristik form Cutoff (inline, bukan dialog):
 *  - Field: name, code, Waktu Mulai (time picker el-input), Durasi (el-input),
 *    Tipe (dropdown Once/Daily/Weekly/Monthly), field dinamis sesuai tipe
 *    (Once At = kalender "Pilih Tanggal", Week Day = dropdown hari, Month Day = kalender),
 *    "Bank yang diterapkan" = dropdown PSP (ambil dari data PSP, bukan menu Bank),
 *    switch Status default unchecked -> WAJIB di-check agar tombol Simpan enabled.
 *  - Ada pencarian (input#search) dan Filter (belum dipakai di test ini).
 *  - Hapus via dialog konfirmasi "Apakah Anda yakin ingin menghapus Cutoff ini?".
 */
const WEBVIEW = 'https://backoffice-ppob-nona-webview-playground.lentera-app.id';

export class PpobNonaCutoffPage {
  readonly page: Page;
  readonly cutoffHeading: Locator;
  readonly addCutoffButton: Locator;
  readonly saveButton: Locator;
  readonly statusSwitch: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cutoffHeading = page.getByRole('heading', { name: 'Master Cutoff' });
    this.addCutoffButton = page.getByRole('button', { name: 'Tambah Cutoff' });
    this.saveButton = page.locator('form button[type="submit"]');
    this.statusSwitch = page.locator('form [role="switch"]');
  }

  /** Buka webview BOT PPOB NONA lalu arahkan ke halaman Master Cutoff. */
  static async open(portalPage: Page): Promise<PpobNonaCutoffPage> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await PpobNonaCutoffPage.openOnce(portalPage);
      } catch (err) {
        lastError = err as Error;
        await portalPage.waitForTimeout(3000);
      }
    }
    throw lastError;
  }

  private static async openOnce(portalPage: Page): Promise<PpobNonaCutoffPage> {
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
    const cutoff = new PpobNonaCutoffPage(webview);
    await cutoff.openCutoffPage();
    return cutoff;
  }

  async openCutoffPage() {
    await this.page.goto(WEBVIEW + '/master/cutoff');
    await expect(this.cutoffHeading).toBeVisible({ timeout: 15000 });
    await expect(this.addCutoffButton).toBeVisible({ timeout: 15000 });
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  // ---------- SEARCH ----------

  private searchInput(): Locator {
    return this.page.locator('main input[placeholder*="Cari" i]').first();
  }

  async search(keyword: string) {
    await this.searchInput().fill(keyword);
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

  async openAddCutoffForm() {
    await this.addCutoffButton.click();
    await this.page.locator('form input[name="name"]').waitFor({ state: 'visible', timeout: 10000 });
  }

  async openEditCutoffForm(keyword: string) {
    await this.search(keyword);
    const row = this.rowFor(keyword);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Ubah' }).click();
    await this.page.locator('form input[name="name"]').waitFor({ state: 'visible', timeout: 10000 });
  }

  private form(): Locator {
    return this.page.locator('form').last();
  }

  async fillNameCode(name: string, code: string) {
    await this.form().locator('input[name="name"]').fill(name);
    await this.form().locator('input[name="code"]').fill(code);
  }

  async fillForm(data: {
    name?: string;
    code?: string;
    type?: string;
    time?: string;
    duration?: string;
    psp?: string;
    day?: string;
    date?: Date;
  }) {
    if (data.name !== undefined) await this.form().locator('input[name="name"]').fill(data.name);
    if (data.code !== undefined) await this.form().locator('input[name="code"]').fill(data.code);
    if (data.type !== undefined) await this.selectType(data.type);
    if (data.time !== undefined) await this.setTime('Pilih waktu', data.time);
    if (data.duration !== undefined) await this.setTime('Pilih Durasi', data.duration);
    if (data.psp !== undefined) await this.selectPsp(data.psp);
    if (data.day !== undefined) await this.selectWeekDay(data.day);
    if (data.date !== undefined) await this.selectCalendarDate(data.date);
    await this.page.waitForTimeout(500);
  }

  /** Pilih tipe cutoff via dropdown (Once/Daily/Weekly/Monthly). */
  async selectType(type: string) {
    const btn = this.form()
      .locator('button')
      .filter({ hasText: /Tipe|Once|Daily|Weekly|Monthly/ })
      .first();
    await btn.click();
    await this.page.waitForTimeout(1000);
    await this.page.locator('[role="option"]', { hasText: type }).first().click();
    await this.page.waitForTimeout(1200);
  }

  /** Isi time picker el-input via keyboard (Waktu Mulai / Durasi). */
  async setTime(placeholder: string, value: string) {
    const inp = this.form().locator(`input[placeholder="${placeholder}"]`).first();
    await inp.click();
    await this.page.waitForTimeout(600);
    await this.page.keyboard.press('ControlOrMeta+A');
    await this.page.keyboard.type(value);
    await this.page.waitForTimeout(600);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(600);
  }

  /** Pilih PSP (Bank yang diterapkan) dari dropdown, mis. 'Bank Mega'. */
  async selectPsp(name: string) {
    await this.form().locator('button', { hasText: 'Pilih PSP' }).first().click();
    await this.page.waitForTimeout(1500);
    await this.page.locator('[role="option"]', { hasText: name }).first().click();
    await this.page.waitForTimeout(1000);
  }

  /** Pilih hari dari dropdown (tipe Weekly), mis. 'Senin'. */
  async selectWeekDay(day: string) {
    await this.form().locator('[role="combobox"]').last().click();
    await this.page.waitForTimeout(1000);
    await this.page.locator('[role="option"]', { hasText: day }).first().click();
    await this.page.waitForTimeout(1000);
  }

  /** Pilih tanggal dari kalender popover (tipe Once / Monthly). target = Date. */
  async selectCalendarDate(target: Date) {
    await this.form().locator('button', { hasText: 'Pilih Tanggal' }).first().click();
    await this.page.waitForTimeout(1500);
    const cal = this.page.locator('[role="dialog"]').last();
    const wantDay = target.getDate();
    const wantMonth = target.getMonth();
    const wantYear = target.getFullYear();
    // navigate ke bulan target bila perlu (maks 2 klik next)
    for (let i = 0; i < 12; i++) {
      const header = (await cal.locator('.text-sm.font-medium').first().textContent()) ?? '';
      const [m, y] = header.split(' ');
      const curMonth = new Date(`${m} 1, ${y}`).getMonth();
      const curYear = Number(y);
      if (curYear === wantYear && curMonth === wantMonth) break;
      const nav = curYear < wantYear || (curYear === wantYear && curMonth < wantMonth) ? 'Next' : 'Previous';
      await cal.getByRole('button', { name: `${nav} page` }).click();
      await this.page.waitForTimeout(500);
    }
    await cal.getByText(String(wantDay), { exact: true }).click();
    await this.page.waitForTimeout(1000);
  }

  /** Set status aktif/nonaktif via switch (default unchecked saat form baru). */
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
    await expect(this.addCutoffButton).toBeVisible({ timeout: 10000 });
  }

  /** Reload halaman lalu pastikan kembali ke daftar Cutoff (untuk bukti hapus). */
  async reload() {
    await this.page.reload();
    await expect(this.cutoffHeading).toBeVisible({ timeout: 15000 });
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  // ---------- DELETE ----------

  /**
   * Hapus cutoff dengan keyword lalu verifikasi hilang di sisi server
   * (reload + cek berulang, karena list bisa menampilkan cache sebelum reload).
   * Data cutoff yang masih AKTIF tidak bisa dihapus -> nonaktifkan dulu via Ubah.
   */
  async deleteCutoff(keyword: string) {
    await this.deactivate(keyword);
    await this.search(keyword);
    const row = this.rowFor(keyword);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Hapus' }).click();
    await this.page.getByRole('button', { name: 'Lanjutkan' }).click();
    await this.page.waitForTimeout(2000);
    await expect(async () => {
      await this.reload();
      expect(await this.hasRow(keyword)).toBeFalsy();
    }).toPass({ timeout: 30000 });
  }

  /** Set status cutoff menjadi non-aktif (syarat agar bisa dihapus). */
  async deactivate(keyword: string) {
    await this.openEditCutoffForm(keyword);
    await this.setStatus(false);
    await this.save();
  }
}