import { Page, Locator, expect, type Download } from '@playwright/test';
import { BaPage } from './BaPage';

/**
 * Page Object - Transaksi (Rekap, Monitoring) & Rekonsiliasi BOT BA.
 * Scope: read/view + fitur dasar search, filter tanggal/status, dan EXPORT.
 *
 * Karakteristik (hasil probe):
 *  - Date picker "Pilih Tanggal"/"Pilih Tanggal Pembayaran" punya preset
 *    Hari Ini / Kemarin / Bulan Ini / Tahun Ini; dialog menutup sendiri
 *    setelah preset diklik.
 *  - EXPORT 2 langkah: klik "Export" -> dialog "Ekspor Data <judul>" ->
 *    tombol "Ekspor" -> download XLSX (filename "Judul - YYYY-MM-DD - YYYY-MM-DD.xlsx").
 *  - Monitoring: search "Cari..." memfilter baris (garbage -> "Tidak ada data"),
 *    filter status combobox "Pilih Status" opsi Pending/Success/Failed.
 *  - Rekonsiliasi (Goto/Kudo/E2Pay/AyoConnect): search "Cari File..." memfilter
 *    nama file; garbage -> "Tidak ada data". Tidak ada tombol Export di halaman ini.
 */
export class BaTransaksiPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  static async openRekap(portalPage: Page): Promise<BaTransaksiPage> {
    const ba = await BaPage.open(portalPage);
    await ba.openRekap();
    return new BaTransaksiPage(ba.page);
  }

  static async openMonitoring(portalPage: Page): Promise<BaTransaksiPage> {
    const ba = await BaPage.open(portalPage);
    await ba.openMonitoring();
    return new BaTransaksiPage(ba.page);
  }

  static async openRekonsiliasi(
    portalPage: Page,
    which: 'Goto' | 'Kudo' | 'E2Pay' | 'AyoConnect',
  ): Promise<BaTransaksiPage> {
    const ba = await BaPage.open(portalPage);
    if (which === 'Goto') await ba.openRekonsiliasiGoto();
    else if (which === 'Kudo') await ba.openRekonsiliasiKudo();
    else if (which === 'E2Pay') await ba.openRekonsiliasiE2Pay();
    else await ba.openRekonsiliasiAyoConnect();
    return new BaTransaksiPage(ba.page);
  }

  // ---------- SHARED ----------

  async tableText(): Promise<string> {
    return ((await this.page.locator('main tbody').textContent()) ?? '').trim().replace(/\s+/g, ' ');
  }

  async rowCount(): Promise<number> {
    return this.page.locator('main tbody tr').count();
  }

  emptyText(): Locator {
    return this.page.locator('main tbody', { hasText: 'Tidak ada data' }).first();
  }

  // ---------- DATE PICKER ----------

  /** Klik "Pilih Tanggal"/"Pilih Tanggal Pembayaran" lalu pilih preset. */
  async pickDatePreset(preset: 'Hari Ini' | 'Kemarin' | 'Bulan Ini' | 'Tahun Ini') {
    await this.page.getByRole('button', { name: /Pilih Tanggal/ }).first().click();
    const dlg = this.page.locator('[role="dialog"]').last();
    await expect(dlg).toBeVisible({ timeout: 10000 });
    await dlg.getByRole('button', { name: preset, exact: true }).first().click();
    await expect(dlg).toBeHidden({ timeout: 15000 });
    await this.page.waitForTimeout(1500);
  }

  // ---------- EXPORT ----------

  /** Export 2 langkah: klik Export -> dialog Ekspor -> klik tombol Ekspor. Kembalikan Download. */
  async exportXlsx(): Promise<Download> {
    await this.page.getByRole('button', { name: 'Export', exact: true }).first().click();
    const dlg = this.page.locator('[role="dialog"]').last();
    await expect(dlg.locator('h2').first()).toContainText('Ekspor Data', { timeout: 15000 });
    const dlPromise = this.page.waitForEvent('download', { timeout: 60000 });
    await dlg.getByRole('button', { name: 'Ekspor', exact: true }).first().click();
    return dlPromise;
  }

  // ---------- SEARCH & FILTER ----------

  /** Search pada Monitoring ("Cari...") atau Rekonsiliasi ("Cari File..."). */
  async search(keyword: string) {
    const input = this.page.locator('main input[placeholder*="Cari"]').first();
    await input.fill(keyword);
    await this.page.waitForTimeout(2500);
  }

  /** Filter status di Monitoring (combobox "Pilih Status"). */
  async filterStatus(status: 'Pending' | 'Success' | 'Failed') {
    await this.page.locator('main [role="combobox"]').filter({ hasText: 'Pilih Status' }).first().click();
    await this.page.waitForTimeout(1200);
    await this.page.locator('[role="option"]:visible').filter({ hasText: status, exact: true }).first().click();
    await this.page.waitForTimeout(2500);
  }
}
