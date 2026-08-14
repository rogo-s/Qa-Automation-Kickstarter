import { test, expect } from '@playwright/test';
import { PpobNonaWebviewPage } from '../../../../shared/pages/PpobNonaWebviewPage';

/**
 * Webview Transaksi BOT PPOB NONA - Postpaid (create VA):
 * 1. Validasi ID Pelanggan non-angka -> error client-side tanpa API (aman, tidak trigger OTP)
 * 2. Alur penuh: input ID + No HP -> OTP salah 1x ("Invalid otp") lalu benar -> detail tagihan
 *    -> Bank Mandiri -> Bayar Sekarang -> Nomor Virtual Account
 *
 * Data riil:
 *  - ID postpaid: 233024234703 (Tarif P1 / 41500VA, tagihan AGU26 Rp 2.605.289,00)
 *    (catatan: 211024234744 sudah terbayar -> "TAGIHAN SUDAH TERBAYAR"; pakai alternatif yang aktif)
 *  - No HP: 085283482657 (beda dari prepaid supaya tidak menumpuk trigger OTP pada satu nomor)
 *  - OTP dummy: 000000 (salah contoh: 111111)
 *  - Metode: Bank Mandiri (semua bank aktif pada postpaid)
 *
 * Catatan: OTP sangat sensitif rate-limit server, jadi dalam satu run penuh hanya 1 pemicu
 * send-otp per spec (OTP salah digabung dalam alur happy path). Tidak pernah >3x salah.
 */
test.describe.configure({ mode: 'serial', timeout: 300000 });

test.describe('PPOB NONA Webview - Postpaid create VA @regression', () => {
  test('1. Validasi ID Pelanggan non-angka: muncul pesan harus angka 9-13 digit @smoke', async ({ page }) => {
    const webview = new PpobNonaWebviewPage(page);

    await webview.openPostpaid();
    await webview.fillCustomer('Nama Bukan Angka', '085283482657');
    await webview.clickLanjutkan();

    await expect(page.getByText('harus berupa angka dengan panjang 9 sampai 13 digit')).toBeVisible({
      timeout: 10000,
    });
  });

  test('2. Alur lengkap postpaid: OTP salah 1x lalu benar, detail tagihan, pay Mandiri, dapat nomor VA @smoke @critical', async ({ page }) => {
    const webview = new PpobNonaWebviewPage(page);

    await webview.openPostpaid();
    await webview.submitCustomer('233024234703', '085283482657');

    // 1x OTP salah: verifikasi pengamanan "Invalid otp" (maks 1x, hindari rate-limit).
    await webview.fillOtp('111111');
    await expect(webview.otpInvalidToast()).toBeVisible({ timeout: 10000 });

    // OTP benar lalu lanjut ke Informasi Pelanggan.
    await webview.verifyOtp('000000');

    // Halaman Informasi Pelanggan: pastikan ID pelanggan & tarif benar.
    await expect(page.getByText('233024234703').first()).toBeVisible();
    await expect(page.getByText('P1 / 41500VA').first()).toBeVisible();

    // Detail tagihan postpaid tampil (tanpa pilihan nominal seperti prepaid).
    await expect(page.getByText('Detail Tagihan')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Rp\s*2\.605\.289(?:,00)?/).first()).toBeVisible();

    // Pilih metode Bank Mandiri lalu Bayar Sekarang.
    await webview.openPaymentMethod();
    await webview.selectBank('Bank Mandiri');

    await expect(page.getByText('Total Pembayaran').first()).toBeVisible();
    await expect(page.getByText(/Rp\s*2\.605\.289(?:,00)?/).first()).toBeVisible();
    await webview.payNow();

    // Nomor Virtual Account muncul & berawal 999 (prefix VA), total tagihan tertera.
    const va = await webview.getVaNumber();
    expect(va).toMatch(/^999/);
    expect(va.replace(/\D/g, '').length).toBeGreaterThanOrEqual(16);
    await expect(page.getByText('Bank Mandiri').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Selesaikan Pembayaran' })).toBeVisible();
    await expect(page.getByText(/Rp\s*2\.605\.289(?:,00)?/).first()).toBeVisible();
  });
});