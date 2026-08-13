import { test, expect } from '@playwright/test';
import { PpobNonaSettlementBankPage } from '../../../shared/pages/PpobNonaSettlementBankPage';

/**
 * Master Data Settlement Bank Account - BOT PPOB NONA (session auth.setup.ts, webview via popup):
 * Menu read-only: hanya fitur pencarian, tidak ada tambah/edit/hapus.
 * 1. Search berdasarkan nama bank: "bni" -> BANK BNI JAKARTA
 * 2. Search berdasarkan nama bank lain: "mandiri" -> Bank Mandiri
 * 3. Search hasil lebih dari satu: "bca" -> 2 baris BCA
 * 4. Search tanpa hasil -> "Tidak ada data"
 * 5. Search kosong kembali -> semua data tampil
 */
test.describe.configure({ mode: 'serial', timeout: 240000 });

test.describe('BOT PPOB NONA - Menu Settlement Bank Account @regression', () => {
  test('1. Search nama bank "bni" menampilkan BANK BNI JAKARTA @smoke', async ({ page }) => {
    const sba = await PpobNonaSettlementBankPage.open(page);

    await sba.search('bni');
    await expect(sba.rowFor('BANK BNI JAKARTA')).toBeVisible({ timeout: 10000 });
    expect(await sba.rowCount()).toBe(1);
  });

  test('2. Search nama bank "mandiri" menampilkan Bank Mandiri @smoke', async ({ page }) => {
    const sba = await PpobNonaSettlementBankPage.open(page);

    await sba.search('mandiri');
    await expect(sba.rowFor('Bank Mandiri')).toBeVisible({ timeout: 10000 });
    expect(await sba.rowCount()).toBe(1);
  });

  test('3. Search nama bank "bca" menampilkan semua baris BCA @smoke', async ({ page }) => {
    const sba = await PpobNonaSettlementBankPage.open(page);

    await sba.search('bca');
    expect(await sba.rowCount()).toBeGreaterThanOrEqual(2);
  });

  test('4. Search tanpa hasil menampilkan "Tidak ada data" @smoke', async ({ page }) => {
    const sba = await PpobNonaSettlementBankPage.open(page);

    await sba.search('zzz_nonexistent_bank');
    await expect(sba.page.locator('main tbody')).toContainText('Tidak ada data', { timeout: 10000 });
    expect(await sba.rowCount()).toBe(0);
  });

  test('5. Kosongkan search -> semua data tampil kembali @smoke', async ({ page }) => {
    const sba = await PpobNonaSettlementBankPage.open(page);

    await sba.search('bni');
    expect(await sba.rowCount()).toBe(1);

    await sba.search('');
    expect(await sba.rowCount()).toBeGreaterThan(1);
  });
});