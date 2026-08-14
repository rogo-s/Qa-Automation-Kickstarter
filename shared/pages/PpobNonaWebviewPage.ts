import { Page, Locator, expect } from '@playwright/test';
import { config } from '../../config';

/**
 * Page Object - Webview Transaksi BOT PPOB NONA.
 * Base URL: ppob-nona-webview-playground.lentera-app.id (terpisah dari webview backoffice master).
 *
 * Alur prepaid (create VA):
 *  /prepaid -> isi ID Pelanggan + No HP -> Lanjutkan (send-otp)
 *  -> isi OTP 6 digit (dummy 000000) -> Verifikasi (create order)
 *  -> halaman Informasi Pelanggan (validasi data meter)
 *  -> pilih nominal token -> pilih metode bayar (Bank Mandiri)
 *  -> Bayar Sekarang (payment-confirm) -> tampil Nomor Virtual Account
 *
 * Validasi:
 *  - ID Pelanggan non-angka -> error client-side (tanpa API):
 *    "ID Pelanggan / Nomor Meter harus berupa angka dengan panjang 9 sampai 13 digit"
 *  - ID salah tapi format valid -> error "IDPEL YANG ANDA MASUKKAN SALAH"
 *  - OTP salah -> toast "Invalid otp"; form tetap terbuka, bisa diisi ulang (maks 1x salah di test).
 *
 * Catatan: Biaya Memasak sedang maintenance; OTP sangat dibatasi rate-limit server, jangan trigger >1x salah.
 */
export class PpobNonaWebviewPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path: string) {
    await this.page.goto(config.ppob_nona_webview_base_url + path);
    await this.page.waitForLoadState('domcontentloaded');
  }

  // ---------- FORM DATA PELANGGAN ----------

  private customerInputs(): Locator {
    return this.page.locator('input[type="text"]');
  }

  customerIdInput(): Locator {
    return this.customerInputs().nth(0);
  }

  customerPhoneInput(): Locator {
    return this.customerInputs().nth(1);
  }

  customerContinueButton(): Locator {
    return this.page.getByRole('button', { name: 'Lanjutkan', exact: true });
  }

  customerError(): Locator {
    return this.page.locator('main, body').getByText(
      /harus berupa angka dengan panjang 9 sampai 13 digit|IDPEL YANG ANDA MASUKKAN SALAH/
    ).first();
  }

  async openPrepaid() {
    await this.goto('/prepaid');
    await expect(this.page.getByText('Masukan Data Pelanggan')).toBeVisible({ timeout: 15000 });
  }

  /** Isi form ID Pelanggan + No HP (tanpa klik). */
  async fillCustomer(customerId: string, phone: string) {
    await this.customerIdInput().fill(customerId);
    await this.customerPhoneInput().fill(phone);
  }

  async clickLanjutkan() {
    await this.customerContinueButton().click();
  }

  /** Isi form lalu klik Lanjutkan; menunggu layar OTP. */
  async submitCustomer(customerId: string, phone: string) {
    await this.fillCustomer(customerId, phone);
    await this.clickLanjutkan();
    await expect(this.page.getByText('Masukan Kode OTP')).toBeVisible({ timeout: 15000 });
  }

  // ---------- OTP ----------

  private otpBoxes(): Locator {
    return this.page.locator('input[type="text"]');
  }

  otpVerifyButton(): Locator {
    return this.page.getByRole('button', { name: 'Verifikasi', exact: true });
  }

  otpInvalidToast(): Locator {
    return this.page.getByText('Invalid otp').first();
  }

  /** Isi 6 kotak OTP lalu klik Verifikasi (tanpa menunggu sukses). */
  async fillOtp(digits: string) {
    const boxes = this.otpBoxes();
    for (let i = 0; i < 6; i++) {
      await boxes.nth(i).fill(digits[i] ?? '0');
    }
    await this.otpVerifyButton().click();
  }

  /** Isi OTP benar lalu menunggu layar Informasi Pelanggan. */
  async verifyOtp(digits: string) {
    await this.fillOtp(digits);
    await expect(this.page.getByText('Informasi Pelanggan')).toBeVisible({ timeout: 15000 });
  }

  /** Ambil informasi pelanggan (nomor meter, nama mask, tarif/daya) setelah OTP sukses. */
  async customerInfo(): Promise<{ meter: string; tariff: string }> {
    const text = (await this.page.locator('body').innerText()).split('\n').map(t => t.trim());
    const meterIdx = text.indexOf('322561241175');
    return {
      meter: text[meterIdx] ?? '',
      tariff: text.includes('B2 / 7700VA') ? 'B2 / 7700VA' : '',
    };
  }

  // ---------- POSTPAID ----------

  async openPostpaid() {
    await this.goto('/postpaid');
    await expect(this.page.getByText('Masukan Data Pelanggan')).toBeVisible({ timeout: 15000 });
  }

  /** Halaman Informasi Pelanggan postpaid: isi form lalu OTP, menunggu detail tagihan. */
  async submitPostpaid(customerId: string, phone: string) {
    await this.submitCustomer(customerId, phone);
    await this.verifyOtp('000000');
    await expect(this.page.getByText('Detail Tagihan')).toBeVisible({ timeout: 15000 });
  }

  // ---------- PEMBAYARAN ----------

  /** Pilih nominal token (default Rp 5.000,00). */
  async selectDenom(label: string) {
    await this.page.getByRole('button', { name: label, exact: true }).click();
  }

  /** Buka panel "Pilih Metode Pembayaran". */
  async openPaymentMethod() {
    await this.page.getByRole('button', { name: /Pilih Metode Pembayaran/ }).first().click();
    await expect(this.page.getByText('Bayar Sekarang')).toBeVisible({ timeout: 10000 });
  }

  /** Pilih bank dari daftar metode pembayaran (Bank Mandiri). */
  async selectBank(name: string) {
    await this.page.locator('text=' + name).last().click();
    await this.page.waitForTimeout(800);
  }

  /** Klik Bayar Sekarang (payment-confirm), menampilkan Nomor Virtual Account. */
  async payNow() {
    await this.page.getByRole('button', { name: 'Bayar Sekarang', exact: true }).click();
    await expect(this.page.getByText('Nomor Virtual Account')).toBeVisible({ timeout: 20000 });
  }

  vaNumber(): Locator {
    return this.page.locator('div.font-mono.text-4xl').first();
  }

  /** Ambil teks Nomor Virtual Account dari halaman Selesaikan Pembayaran. */
  async getVaNumber(): Promise<string> {
    return (await this.vaNumber().textContent()).trim().replace(/\s+/g, ' ');
  }

  // ---------- RIWAYAT TRANSAKSI ----------

  /** Buka halaman Riwayat Transaksi (daftar transaksi berdasarkan ID Pelanggan/Nomor Meter). */
  async openHistory(idpel: string) {
    await this.goto('/transaction-history');
    await expect(this.page.getByText('ID Pelanggan / Nomor Meter')).toBeVisible({ timeout: 15000 });
    await expect(this.page.getByRole('button', { name: /Cari Transaksi/ })).toBeVisible({ timeout: 10000 });
    await this.page.locator('#search').fill(idpel);
  }

  /** Klik Cari Transaksi lalu menunggu daftar hasil (atau pesan kosong). */
  async searchHistory() {
    await this.page.getByRole('button', { name: /Cari Transaksi/ }).click();
    await expect(this.page.getByText(/Daftar Transaksi Terakhir/)).toBeVisible({ timeout: 15000 });
  }

  historyRow(): Locator {
    return this.page.locator('table tbody tr').first();
  }

  historyEmpty(): Locator {
    return this.page.getByText('Tidak ada data transaksi').first();
  }
}