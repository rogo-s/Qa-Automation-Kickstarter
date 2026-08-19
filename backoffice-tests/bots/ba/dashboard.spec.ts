import { test, expect } from '@playwright/test';
import { BaPage } from '../../../shared/pages/BaPage';

/**
 * Dashboard - BOT BA (Biller Aggregator).
 * Fase 1: verifikasi dashboard terbuka dan widget utama tampil.
 */
test.describe.configure({ mode: 'serial', timeout: 180000 });

test.describe('BOT BA - Dashboard @regression', () => {
  test('Buka dashboard: widget statistik & ringkasan tampil @smoke', async ({ page }) => {
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
});
