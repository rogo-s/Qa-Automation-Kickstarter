import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model - Admin Login (Back Office)
 * Selector disesuaikan dengan portal backoffice yang sedang dipakai untuk adaptasi.
 */
export class AdminLoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly captchaDialog: Locator;
  readonly captchaHeading: Locator;
  readonly captchaInstruction: Locator;
  readonly captchaBypassR: Locator;
  readonly otpInputs: Locator;
  readonly otpHiddenInput: Locator;
  readonly flashMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByPlaceholder('Masukan email kamu');
    this.passwordInput = page.getByPlaceholder('Masukan kata sandi kamu');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.captchaDialog = page.getByText('Verifikasi Captcha');
    this.captchaHeading = page.getByText('Verifikasi Captcha');
    this.captchaInstruction = page.getByText('Lakukan perintah captcha dengan benar');
    this.captchaBypassR = this.captchaInstruction.locator('span').first();
    this.otpInputs = page.locator('input[autocomplete="one-time-code"]');
    this.otpHiddenInput = page.locator('#pin-input');
    this.flashMessage = page.getByText('Email atau password salah');
  }

  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async bypassCaptcha() {
    await this.captchaHeading.waitFor({ state: 'visible', timeout: 10000 });
    await this.captchaInstruction.waitFor({ state: 'visible', timeout: 10000 });

    if (await this.captchaBypassR.count()) {
      await this.captchaBypassR.click();
    }
  }

  async submitOtp(otp: string) {
    await this.otpInputs.first().waitFor({ state: 'visible', timeout: 15000 });

    const otpDigits = otp.split('');
    for (let i = 0; i < otpDigits.length; i++) {
      await this.otpInputs.nth(i).fill(otpDigits[i]);
    }

    if (await this.otpHiddenInput.count()) {
      await this.otpHiddenInput.fill(otp);
    }

    await this.page.keyboard.press('Enter');

    // Pastikan OTP ter-submit sebelum lanjut (tunggu dialog OTP tertutup).
    await this.page
      .getByText('Silahkan Masukan Kode OTP')
      .waitFor({ state: 'hidden', timeout: 15000 });
  }
}
