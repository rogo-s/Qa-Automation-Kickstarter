import { test, expect } from '@playwright/test';
import { MiniappPage } from '../../../shared/pages/MinappPage';

/**
 * Dashboard - BOT MINIAPP.
 * Read + toggle metrik + dropdown periode.
 *
 * 1. Widget Ringkasan Hari Ini & Analisa Transaksi tampil
 * 2. Toggle "Total Transaksi" jadi aktif (shadow-sm/text-warning)
 * 3. Dropdown periode: pilih "Bulanan" lalu kembalikan ke "Harian"
 * 4. Legend status transaksi (SUCCESS/FAILED/PROCESS/EXPIRED) tampil
 */
test.describe.configure({ mode: 'serial', timeout: 300000 });

test.describe('BOT MINIAPP - Dashboard @regression', () => {
  test('1. Buka dashboard: Ringkasan Hari Ini & Analisa Transaksi tampil @smoke', async ({ page }) => {
    const mini = await MiniappPage.open(page);
    await mini.openDashboard();

    await expect(mini.page.getByText(/Selamat/).first()).toBeVisible({ timeout: 15000 });
    await expect(mini.page.getByText('Ringkasan Hari Ini').first()).toBeVisible();
    await expect(mini.page.getByText('Analisa Transaksi').first()).toBeVisible();
    await expect(mini.page.getByText('Jumlah Transaksi Berdasarkan Status').first()).toBeVisible();
    await expect(mini.page.getByText('Jumlah Transaksi Berdasarkan Produk').first()).toBeVisible();
  });

  test('2. Toggle metrik Total Transaksi: tombol jadi aktif @smoke', async ({ page }) => {
    const mini = await MiniappPage.open(page);
    await mini.openDashboard();

    const totalTrx = mini.toggleButton('Total Transaksi');
    await expect(totalTrx).toBeVisible({ timeout: 15000 });
    await totalTrx.click();
    await expect(totalTrx).toHaveClass(/shadow-sm/, { timeout: 10000 });
  });

  test('3. Dropdown periode: pilih "Bulanan" lalu kembalikan ke "Harian" @smoke', async ({ page }) => {
    const mini = await MiniappPage.open(page);
    await mini.openDashboard();

    await mini.pickPeriode('Bulanan');
    await expect(mini.page.locator('main button').filter({ hasText: 'Bulanan' }).first()).toBeVisible({ timeout: 10000 });
    await expect(mini.page.getByText('Ringkasan Hari Ini').first()).toBeVisible();

    await mini.page.locator('main button').filter({ hasText: 'Bulanan' }).first().click();
    await mini.page.waitForTimeout(1000);
    await mini.page.getByRole('menuitem', { name: 'Harian', exact: true }).first().click();
    await mini.page.waitForTimeout(2000);
    await expect(mini.page.locator('main button').filter({ hasText: 'Harian' }).first()).toBeVisible({ timeout: 10000 });
  });

  test('4. Legend status transaksi tampil di dashboard @smoke', async ({ page }) => {
    const mini = await MiniappPage.open(page);
    await mini.openDashboard();

    for (const status of ['SUCCESS', 'FAILED', 'PROCESS', 'EXPIRED']) {
      await expect(mini.page.getByText(status, { exact: true }).first()).toBeVisible({ timeout: 15000 });
    }
  });
});
