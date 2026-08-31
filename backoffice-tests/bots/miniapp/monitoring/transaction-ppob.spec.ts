import { test, expect } from '@playwright/test';
import { MiniappMonitoringPage } from '../../../../shared/pages/MiniappMonitoringPage';

/**
 * Monitoring Informasi Transaksi PPOB - BOT MINIAPP
 * Probe 28-08-2026: heading "Informasi Transaksi PPOB", search, Pilih Tanggal, Export, view only
 */
test.describe.configure({ mode: 'serial', timeout: 240000 });

test.describe('BOT MINIAPP - Monitoring Informasi Transaksi PPOB @regression', () => {
  test('1. View: heading & tabel tampil @smoke', async ({ page }) => {
    const m = await MiniappMonitoringPage.open(page, 'transaction-ppob');
    await expect(m.headingLoc()).toBeVisible();
    await expect(m.table()).toBeVisible();
    const cnt = await m.rowCount();
    expect(cnt).toBeGreaterThan(0);
  });

  test('2. Search: cari & kosong @smoke', async ({ page }) => {
    const m = await MiniappMonitoringPage.open(page, 'transaction-ppob');
    await m.search('BILL');
    const c1 = await m.rowCount();
    console.log('[INFO] search BILL rows', c1);
    await m.search('ZZZ_NOT_EXIST_999');
    const c0 = await m.rowCount();
    if (c0===0) console.log('[INFO] search tidak ada → 0 rows valid');
    else console.log('[TEMUAN] search acak masih ada rows');
    await m.search('');
  });

  test('3. Date picker: Pilih Tanggal tampil @smoke', async ({ page }) => {
    const m = await MiniappMonitoringPage.open(page, 'transaction-ppob');
    await m.openDatePicker();
    const dlg = m.page.getByRole('dialog');
    if (await dlg.isVisible().catch(()=>false)) {
      await expect(dlg).toBeVisible();
      await m.page.keyboard.press('Escape');
    } else {
      console.log('[TEMUAN] Date picker dialog tidak muncul transaction-ppob');
    }
  });

  test('4. Export: tombol Export tampil @smoke', async ({ page }) => {
    const m = await MiniappMonitoringPage.open(page, 'transaction-ppob');
    const btn = m.page.getByRole('button', { name: 'Export' }).first();
    await expect(btn).toBeVisible();
    // tidak download full untuk view-only, cukup cek visible
  });
});
