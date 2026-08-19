import { test, expect } from '@playwright/test';
import { BaPage } from '../../../shared/pages/BaPage';

/**
 * Rekonsiliasi (Goto, Kudo, E2Pay, AyoConnect) - BOT BA (Biller Aggregator).
 * Fase 1: buka tiap halaman rekon, verifikasi tabel + tombol Upload + ringkasan perbandingan.
 */
test.describe.configure({ mode: 'serial', timeout: 300000 });

test.describe('BOT BA - Menu Rekonsiliasi @regression', () => {
  test('Buka Rekonsiliasi Goto: tabel perbandingan & tombol Upload tampil @smoke', async ({ page }) => {
    const ba = await BaPage.open(page);
    await ba.openRekonsiliasiGoto();

    await ba.expectTableHeader('File', 'Periode Transaksi', 'Perbandingan', 'Force Actions', 'Status');
    await expect(ba.page.getByRole('button', { name: 'Upload', exact: true }).first()).toBeVisible({ timeout: 15000 });
    await expect(ba.page.locator('main input[placeholder="Cari File..."]').first()).toBeVisible();
  });

  test('Buka Rekonsiliasi Kudo: tabel perbandingan & Upload Files tampil @smoke', async ({ page }) => {
    const ba = await BaPage.open(page);
    await ba.openRekonsiliasiKudo();

    await ba.expectTableHeader('Nama File', 'Tanggal Upload', 'Tanggal Transaksi', 'Total Biller', 'Total System', 'Force Paid', 'Force Failed', 'Status');
    await expect(ba.page.getByRole('button', { name: 'Upload Files' }).first()).toBeVisible({ timeout: 15000 });
  });

  test('Buka Rekonsiliasi E2Pay: tabel perbandingan & Upload Files tampil @smoke', async ({ page }) => {
    const ba = await BaPage.open(page);
    await ba.openRekonsiliasiE2Pay();

    await ba.expectTableHeader('Nama File', 'Tanggal Upload', 'Tanggal Transaksi', 'Total Biller', 'Total System', 'Force Paid', 'Force Failed', 'Status');
    await expect(ba.page.getByRole('button', { name: 'Upload Files' }).first()).toBeVisible({ timeout: 15000 });
  });

  test('Buka Rekonsiliasi AyoConnect: tabel perbandingan & Upload Files tampil @smoke', async ({ page }) => {
    const ba = await BaPage.open(page);
    await ba.openRekonsiliasiAyoConnect();

    await ba.expectTableHeader('Nama File', 'Tanggal Upload', 'Tanggal Transaksi', 'Total Biller', 'Total System', 'Force Paid', 'Force Failed', 'Status');
    await expect(ba.page.getByRole('button', { name: 'Upload Files' }).first()).toBeVisible({ timeout: 15000 });
  });
});
