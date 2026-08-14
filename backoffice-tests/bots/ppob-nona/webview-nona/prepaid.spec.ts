import { test, expect } from '@playwright/test';
import { PpobNonaWebviewPage } from '../../../../shared/pages/PpobNonaWebviewPage';

/**
 * Webview Transaksi BOT PPOB NONA - Prepaid (create VA):
 * 1. Validasi input ID Pelanggan non-angka (string/nama) -> error client-side tanpa API
 * 2. Validasi OTP salah 1x (maks 1x karena OTP rate-limit ketat) -> "Invalid otp", lalu OTP benar -> lanjut
 * 3. Alur penuh: input ID Pelanggan + No HP -> OTP 000000 -> pilih token Rp 5.000 -> Bank Mandiri -> Bayar Sekarang
 * 4. Verifikasi munculnya Nomor Virtual Account (uniks per transaksi)
 *
 * Data riil:
 *  - ID meter: 322561241175 (Nama NRM****, Tarif B2 / 7700VA)
 *  - No HP: 087789307941
 *  - OTP dummy: 000000 (salah contoh: 111111)
 *  - Nominal: Rp 5.000,00
 *  - Metode: Bank Mandiri (Bank BRI juga aktif; BTN/BSI "melebihi range payment provider")
 *
 * Catatan: OTP sangat sensitif rate-limit server (hang/500 bila terlalu sering), jadi
 * validasi OTP salah dilakukan cukup 1x dan tidak pernah >3x salah.
 */
test.describe.configure({ mode: 'serial', timeout: 300000 });

test.describe('PPOB NONA Webview - Prepaid create VA @regression', () => {
  test('1. Validasi ID Pelanggan non-angka: muncul pesan harus angka 9-13 digit @smoke', async ({ page }) => {
    const webview = new PpobNonaWebviewPage(page);

    await webview.openPrepaid();
    await webview.fillCustomer('Nama Bukan Angka', '087789307941');
    await webview.clickLanjutkan();

    await expect(page.getByText('harus berupa angka dengan panjang 9 sampai 13 digit')).toBeVisible({
      timeout: 10000,
    });
  });

  test('2. Alur lengkap prepaid: OTP salah 1x lalu benar, token 5rb, pay Mandiri, dapat nomor VA @smoke @critical', async ({ page }) => {
    const webview = new PpobNonaWebviewPage(page);

    await webview.openPrepaid();
    await webview.submitCustomer('322561241175', '087789307941');

    // 1x OTP salah: verifikasi pengamanan "Invalid otp" (maks 1x, hindari rate-limit).
    await webview.fillOtp('111111');
    await expect(webview.otpInvalidToast()).toBeVisible({ timeout: 10000 });

    // OTP benar lalu lanjut ke Informasi Pelanggan.
    await webview.verifyOtp('000000');

    // Halaman Informasi Pelanggan: pastikan Nomor Meter & Tarif/Daya benar.
    await expect(page.getByText('322561241175').first()).toBeVisible();
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