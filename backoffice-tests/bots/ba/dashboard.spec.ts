import { test, expect } from '@playwright/test';
import { BaPage } from '../../../shared/pages/BaPage';

/**
 * Dashboard - BOT BA (Biller Aggregator).
 * Read + toggle metrik chart + dropdown periode.
 *
 * 1. Widget statistik & ringkasan tampil
 * 2. Toggle metrik "Total Transaksi" -> aktif (bg-primary); "Total Rupiah" -> aktif
 * 3. Toggle distribusi "Total Rupiah" (section Distribusi Berdasarkan Status) -> aktif
 * 4. Dropdown periode "Harian" -> pilih "Bulanan" -> label berubah, lalu kembalikan
 */
test.describe.configure({ mode: 'serial', timeout: 300000 });

test.describe('BOT BA - Dashboard @regression', () => {
  test('1. Buka dashboard: widget statistik & ringkasan tampil @smoke', async ({ page }) => {
    const ba = await BaPage.open(page);
    await ba.openDashboard();

    await expect(ba.heading(/Selamat Datang/)).toBeVisible({ timeout: 15000 });
    for (const text of ['Total Mitra', 'Total Biller', 'Total Product']) {
      await expect(ba.page.getByText(text).first()).toBeVisible({ timeout: 15000 });
    }
    await expect(ba.page.getByText('Ringkasan Hari Ini').first()).toBeVisible();
    await expect(ba.page.getByText('Distribusi Berdasarkan Status').first()).toBeVisible();
    await expect(ba.page.getByText('Distribusi Berdasarkan Produk').first()).toBeVisible();
    await expect(ba.page.getByText('Top 5 Mitra').first()).toBeVisible();
    await expect(ba.page.getByText('Top 5 Product').first()).toBeVisible();
    await expect(ba.page.getByText('Top 5 Biller').first()).toBeVisible();
  });

  test('2. Toggle metrik Total Transaksi: tombol jadi aktif (bg-primary) @smoke', async ({ page }) => {
    const ba = await BaPage.open(page);
    await ba.openDashboard();

    const totalTrx = ba.page.locator('main button').filter({ hasText: 'Total Transaksi' }).first();
    const totalRp = ba.page.locator('main button').filter({ hasText: 'Total Rupiah' }).first();

    await totalTrx.click();
    await expect(totalTrx).toHaveClass(/bg-primary/, { timeout: 10000 });

    await totalRp.click();
    await expect(totalRp).toHaveClass(/bg-primary/, { timeout: 10000 });
  });

  test('3. Toggle Distribusi Berdasarkan Status: "Total Rupiah" jadi aktif @smoke', async ({ page }) => {
    const ba = await BaPage.open(page);
    await ba.openDashboard();

    // Section Distribusi Berdasarkan Status berisi toggle ke-2 "Total Rupiah"
    const distribusiRp = ba.page.locator('main button').filter({ hasText: 'Total Rupiah' }).nth(1);
    await distribusiRp.click();
    await expect(distribusiRp).toHaveClass(/bg-primary/, { timeout: 10000 });
  });

  test('4. Dropdown periode: pilih "Bulanan" lalu kembalikan ke "Harian" @smoke', async ({ page }) => {
    const ba = await BaPage.open(page);
    await ba.openDashboard();

    const harian = ba.page.locator('main button').filter({ hasText: 'Harian' }).first();
    await expect(harian).toBeVisible({ timeout: 15000 });

    await harian.click();
    await ba.page.waitForTimeout(1000);
    await ba.page.getByRole('menuitem', { name: 'Bulanan' }).first().click();
    await ba.page.waitForTimeout(2000);

    await expect(ba.page.locator('main button').filter({ hasText: 'Bulanan' }).first()).toBeVisible({ timeout: 10000 });
    // widget utama tetap tampil setelah ganti periode
    await expect(ba.page.getByText('Ringkasan Hari Ini').first()).toBeVisible();

    // kembalikan ke Harian
    const bulanan = ba.page.locator('main button').filter({ hasText: 'Bulanan' }).first();
    await bulanan.click();
    await ba.page.waitForTimeout(1000);
    await ba.page.getByRole('menuitem', { name: 'Harian' }).first().click();
    await ba.page.waitForTimeout(2000);
    await expect(ba.page.locator('main button').filter({ hasText: 'Harian' }).first()).toBeVisible({ timeout: 10000 });
  });
});
