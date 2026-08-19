import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { BaTransaksiPage } from '../../../shared/pages/BaTransaksiPage';

const EXPORT_DIR = path.join(__dirname, 'export_data');

/**
 * Transaksi Monitoring - BOT BA (Biller Aggregator).
 * Read/view + search + filter status + export (disimpan ke export_data/).
 *
 * 1. Buka halaman Monitoring: tabel & kolom tampil
 * 2. Search "Ayo" menampilkan baris; search acak -> "Tidak ada data"
 * 3. Filter status "Success": semua baris berstatus SUCCESS
 * 4. Export data (range Tahun Ini) -> XLSX terdownload & tersimpan
 */
test.describe.configure({ mode: 'serial', timeout: 300000 });

test.describe('BOT BA - Menu Monitoring Transaksi @regression', () => {
  test('1. Buka halaman Monitoring: tabel & kolom tampil @smoke', async ({ page }) => {
    const trans = await BaTransaksiPage.openMonitoring(page);

    await expect(trans.page.getByRole('heading', { name: 'Informasi Transaksi' })).toBeVisible({ timeout: 15000 });
    const thead = trans.page.locator('main table thead');
    await expect(thead).toBeVisible({ timeout: 15000 });
    for (const col of ['Id Biller', 'Tanggal Transaksi', 'Biller', 'Mitra', 'Product', 'Type Product', 'Total', 'ID Transaksi', 'Status Transaksi']) {
      await expect(thead).toContainText(col);
    }
  });

  test('2. Search: keyword cocok menampilkan baris, keyword acak -> "Tidak ada data" @smoke', async ({ page }) => {
    const trans = await BaTransaksiPage.openMonitoring(page);

    await trans.search('Ayo');
    const matched = await trans.tableText();
    expect(matched).not.toContain('Tidak ada data');
    expect(matched).toContain('Ayo connect');

    await trans.search('zzzznothing');
    const empty = await trans.tableText();
    expect(empty).toContain('Tidak ada data');
  });

  test('3. Filter status "Success": semua baris berstatus SUCCESS @smoke', async ({ page }) => {
    const trans = await BaTransaksiPage.openMonitoring(page);

    await trans.filterStatus('Success');

    const text = await trans.tableText();
    expect(text).toContain('SUCCESS');
    expect(text).not.toContain('FAILED');
  });

  test('4. Export data monitoring (range Tahun Ini): XLSX terdownload & tersimpan @smoke', async ({ page }) => {
    const trans = await BaTransaksiPage.openMonitoring(page);

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
