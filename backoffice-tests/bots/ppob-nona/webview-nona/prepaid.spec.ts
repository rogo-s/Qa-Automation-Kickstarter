import { test, expect } from '@playwright/test';
import { PpobNonaWebviewPage } from '../../../../shared/pages/PpobNonaWebviewPage';

/**
 * Webview Transaksi BOT PPOB NONA - Prepaid (create VA):
 * 1. Alur penuh: isi ID Pelanggan + No HP -> OTP 000000 -> pilih token Rp 5.000 -> Bank Mandiri -> Bayar Sekarang
 * 2. Verifikasi munculnya Nomor Virtual Account (temat VA unik per transaksi)
 *
 * Data riil:
 *  - ID meter: 322561241175 (Nama NRM****, Tarif B2 / 7700VA)
 *  - No HP: 089632331938
 *  - OTP dummy: 000000
 *  - Nominal: Rp 5.000,00
 *  - Metode: Bank Mandiri (Bank BRI juga aktif; BTN/BSI "melebihi range payment provider")
 */
test.describe.configure({ mode: 'serial', timeout: 240000 });

test.describe('PPOB NONA Webview - Prepaid create VA @regression', () => {
  test('1. Alur lengkap prepaid: input ID, OTP, token 5rb, pay Mandiri, dapat nomor VA @smoke @critical', async ({ page }) => {
    const webview = new PpobNonaWebviewPage(page);

    await webview.openPrepaid();
    await webview.fillCustomer('322561241175', '089632331938');
    await webview.verifyOtp('000000');

    // Halaman Informasi Pelanggan: pastikan Nomor Meter & Tarif/Daya benar.
    await expect(page.getByText('322561241175')).toBeVisible();
    await expect(page.getByText('B2 / 7700VA').first()).toBeVisible();

    // Pilih nominal token 5rb.
    await webview.selectDenom('Rp 5.000,00');

    // Pilih metode Bank Mandiri lalu Bayar Sekarang.
    await webview.openPaymentMethod();
    await webview.selectBank('Bank Mandiri');

    // Setelah memilih bank, Detail Tagihan & Total Pembayaran tampil.
    await expect(page.getByText('Detail Tagihan')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Rp 5.000,00').first()).toBeVisible();
    await webview.payNow();

    // Nomor Virtual Account muncul & berawal 9993 (prefix VA), total Rp 5.000,00, metode Mandiri.
    const va = await webview.getVaNumber();
    expect(va).toMatch(/^9993/);
    expect(va.replace(/\D/g, '').length).toBeGreaterThanOrEqual(16);
    await expect(page.getByText('Bank Mandiri').first()).toBeVisible();
    await expect(page.getByText('Total Pembayaran').first()).toBeVisible();
    await expect(page.getByText('Rp 5.000,00').first()).toBeVisible();
  });
});