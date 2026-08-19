import { test, expect } from '@playwright/test';
import { BaTransaksiPage } from '../../../shared/pages/BaTransaksiPage';

/**
 * Rekonsiliasi (Goto, Kudo, E2Pay, AyoConnect) - BOT BA (Biller Aggregator).
 * Read/view + search file. (Halaman rekon tidak punya tombol Export;
 * aksi upload file belum masuk scope test ini.)
 *
 * 1-4. Buka tiap halaman rekon: tabel perbandingan & tombol Upload tampil
 * 5. Search "Cari File..." di Goto: keyword cocok -> baris; acak -> "Tidak ada data"
 * 6. Search "Cari File..." di Kudo: keyword cocok -> baris; acak -> "Tidak ada data"
 */
test.describe.configure({ mode: 'serial', timeout: 360000 });

test.describe('BOT BA - Menu Rekonsiliasi @regression', () => {
  test('Buka Rekonsiliasi Goto: tabel perbandingan & tombol Upload tampil @smoke', async ({ page }) => {
    const trans = await BaTransaksiPage.openRekonsiliasi(page, 'Goto');

    const thead = trans.page.locator('main table thead');
    await expect(thead).toBeVisible({ timeout: 15000 });
    for (const col of ['File', 'Periode Transaksi', 'Perbandingan', 'Force Actions', 'Status']) {
      await expect(thead).toContainText(col);
    }
    await expect(trans.page.getByRole('button', { name: 'Upload', exact: true }).first()).toBeVisible({ timeout: 15000 });
  });

  test('Buka Rekonsiliasi Kudo: tabel perbandingan & Upload Files tampil @smoke', async ({ page }) => {
    const trans = await BaTransaksiPage.openRekonsiliasi(page, 'Kudo');

    const thead = trans.page.locator('main table thead');
    await expect(thead).toBeVisible({ timeout: 15000 });
    for (const col of ['Nama File', 'Tanggal Upload', 'Tanggal Transaksi', 'Total Biller', 'Total System', 'Force Paid', 'Force Failed', 'Status']) {
      await expect(thead).toContainText(col);
    }
    await expect(trans.page.getByRole('button', { name: 'Upload Files' }).first()).toBeVisible({ timeout: 15000 });
  });

  test('Buka Rekonsiliasi E2Pay: tabel perbandingan & Upload Files tampil @smoke', async ({ page }) => {
    const trans = await BaTransaksiPage.openRekonsiliasi(page, 'E2Pay');

    const thead = trans.page.locator('main table thead');
    await expect(thead).toBeVisible({ timeout: 15000 });
    for (const col of ['Nama File', 'Tanggal Upload', 'Tanggal Transaksi', 'Total Biller', 'Total System', 'Force Paid', 'Force Failed', 'Status']) {
      await expect(thead).toContainText(col);
    }
    await expect(trans.page.getByRole('button', { name: 'Upload Files' }).first()).toBeVisible({ timeout: 15000 });
  });

  test('Buka Rekonsiliasi AyoConnect: tabel perbandingan & Upload Files tampil @smoke', async ({ page }) => {
    const trans = await BaTransaksiPage.openRekonsiliasi(page, 'AyoConnect');

    const thead = trans.page.locator('main table thead');
    await expect(thead).toBeVisible({ timeout: 15000 });
    for (const col of ['Nama File', 'Tanggal Upload', 'Tanggal Transaksi', 'Total Biller', 'Total System', 'Force Paid', 'Force Failed', 'Status']) {
      await expect(thead).toContainText(col);
    }
    await expect(trans.page.getByRole('button', { name: 'Upload Files' }).first()).toBeVisible({ timeout: 15000 });
  });

  test('Search Cari File di Goto: keyword cocok tampil, acak -> "Tidak ada data" @smoke', async ({ page }) => {
    const trans = await BaTransaksiPage.openRekonsiliasi(page, 'Goto');

    await trans.search('pgs');
    const matched = await trans.tableText();
    expect(matched).not.toContain('Tidak ada data');
    expect(matched).toContain('pgs_transactionlist');

    await trans.search('zzzznothing');
    const empty = await trans.tableText();
    expect(empty).toContain('Tidak ada data');
  });

  test('Search Cari File di Kudo: keyword cocok tampil, acak -> "Tidak ada data" @smoke', async ({ page }) => {
    const trans = await BaTransaksiPage.openRekonsiliasi(page, 'Kudo');

    await trans.search('KUDO');
    const matched = await trans.tableText();
    expect(matched).not.toContain('Tidak ada data');
    expect(matched).toContain('RCN_KUDO');

    await trans.search('zzzznothing');
    const empty = await trans.tableText();
    expect(empty).toContain('Tidak ada data');
  });
});
