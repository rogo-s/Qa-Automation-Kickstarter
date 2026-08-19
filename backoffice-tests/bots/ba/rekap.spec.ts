import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { BaTransaksiPage } from '../../../shared/pages/BaTransaksiPage';

const EXPORT_DIR = path.join(__dirname, 'export_data');

/**
 * Transaksi Rekap - BOT BA (Biller Aggregator).
 * Read/view + filter tanggal + export (range Tahun Ini, disimpan ke export_data/).
 *
 * 1. Buka halaman Rekap Transaksi: tabel & kolom tampil
 * 2. Filter tanggal preset "Tahun Ini": data tetap tampil
 * 3. Export data rekap (range Tahun Ini) -> XLSX terdownload & tersimpan
 */
test.describe.configure({ mode: 'serial', timeout: 300000 });

test.describe('BOT BA - Menu Rekap Transaksi @regression', () => {
  test('1. Buka halaman Rekap Transaksi: tabel & kolom tampil @smoke', async ({ page }) => {
    const trans = await BaTransaksiPage.openRekap(page);

    await expect(trans.page.getByRole('heading', { name: 'Rekap Transaksi' })).toBeVisible({ timeout: 15000 });
    const thead = trans.page.locator('main table thead');
    await expect(thead).toBeVisible({ timeout: 15000 });
    for (const col of ['Tanggal Transaksi', 'Total Transaksi', 'Total Jumlah (Rp)', 'Total Tagihan Billing (Rp)', 'Total Pendapatan (Rp)']) {
      await expect(thead).toContainText(col);
    }
  });

  test('2. Filter tanggal preset "Tahun Ini": data rekap tetap tampil @smoke', async ({ page }) => {
    const trans = await BaTransaksiPage.openRekap(page);

    await trans.pickDatePreset('Tahun Ini');

    const text = await trans.tableText();
    expect(text).not.toContain('Tidak ada data');
    await expect(trans.page.locator('main tbody tr').first()).toBeVisible({ timeout: 10000 });
  });

  test('3. Export data rekap (range Tahun Ini): XLSX terdownload & tersimpan @smoke', async ({ page }) => {
    const trans = await BaTransaksiPage.openRekap(page);

    await trans.pickDatePreset('Tahun Ini');
    const download = await trans.exportXlsx();

    const filename = download.suggestedFilename();
    expect(filename).toMatch(/\.xlsx$/);

    const dest = path.join(EXPORT_DIR, filename);
    await download.saveAs(dest);
    expect(fs.existsSync(dest)).toBeTruthy();
    expect(fs.statSync(dest).size).toBeGreaterThan(0);
  });
});
