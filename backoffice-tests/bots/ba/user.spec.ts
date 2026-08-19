import { test, expect } from '@playwright/test';
import { BaPage } from '../../../shared/pages/BaPage';

/**
 * Master Data Manage User - BOT BA (Biller Aggregator).
 * Fase 1: buka halaman List User, verifikasi tabel + tab Internal/Mitra.
 */
test.describe.configure({ mode: 'serial', timeout: 180000 });

test.describe('BOT BA - Menu Manage User @regression', () => {
  test('Buka halaman List User: tabel, tab & filter tampil @smoke', async ({ page }) => {
    const ba = await BaPage.open(page);
    await ba.openUser();

    await ba.expectTableHeader('Email', 'Nama Lengkap', 'Nomor Telepon', 'Role', 'Status');
    for (const tab of ['Internal', 'Mitra']) {
      await expect(ba.page.getByRole('button', { name: tab, exact: true }).first()).toBeVisible({ timeout: 15000 });
    }
    await expect(ba.filterControl('Pilih Status').first()).toBeVisible();
    await expect(ba.page.locator('main input[placeholder="Cari User"]').first()).toBeVisible();
  });
});
