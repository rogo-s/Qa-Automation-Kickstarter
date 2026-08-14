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
 * Catatan: Biaya Memasak sedang maintenance, scope saat ini prepaid & postpaid (prepaid dulu).
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

  // ---------- PREPAID ----------

  private customerInputs(): Locator {
    return this.page.locator('input[type="text"]');
  }

  private otpInputs(): Locator {
    return this.page.locator('input[type="text"]');
  }

  async openPrepaid() {
    await this.goto('/prepaid');
    await expect(this.page.getByText('Masukan Data Pelanggan')).toBeVisible({ timeout: 15000 });
  }

  /** Isi ID Pelanggan/Nomor Meter + No HP lalu klik Lanjutkan (trigger send-otp). */
  async fillCustomer(customerId: string, phone: string) {
    const inputs = this.customerInputs();
    await inputs.nth(0).fill(customerId);
    await inputs.nth(1).fill(phone);
    await this.page.getByRole('button', { name: 'Lanjutkan', exact: true }).click();
    await expect(this.page.getByText('Masukan Kode OTP')).toBeVisible({ timeout: 15000 });
  }

  /** Isi 6 kotak OTP lalu klik Verifikasi. */
  async verifyOtp(digits: string) {
    const boxes = this.otpInputs();
    for (let i = 0; i < 6; i++) {
      await boxes.nth(i).fill(digits[i] ?? '0');
    }
    await this.page.getByRole('button', { name: 'Verifikasi', exact: true }).click();
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
}