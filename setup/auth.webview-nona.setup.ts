import { test as setup, expect } from '@playwright/test';
import { config } from '../config';

const WEBVIEW = config.ppob_nona_webview_base_url!;

/**
 * Setup login WEBVIEW TRANSKASI BOT PPOB NONA (1x) lalu simpan session ke .auth/webview-nona.json.
 * Webview ini terpisah dari backoffice master (login sendiri: email/password + captcha bypass R).
 * Semua test transaksi memakai session ini (tidak login berulang).
 */
setup('PPOB NONA Webview Transaksi - login & simpan session', async ({ page, context }) => {
  setup.setTimeout(120000);
  // Header validasi webview (HeaderMod: X-DEVICE-ID, X-LATITUDE, X-LONGITUDE)
  await context.setExtraHTTPHeaders({
    'X-DEVICE-ID': 's5e8855',
    'X-LATITUDE': '-6.175392',
    'X-LONGITUDE': '106.827153',
  });
  // juga via route untuk XHR/fetch
  await page.route('**/*', async (route) => {
    const headers = {
      ...route.request().headers(),
      'X-DEVICE-ID': 's5e8855',
      'X-LATITUDE': '-6.175392',
      'X-LONGITUDE': '106.827153',
    };
    await route.continue({ headers });
  });

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await page.goto(WEBVIEW + '/login');
      await page.locator('input[name="email"]').waitFor({ state: 'visible', timeout: 20000 });
      await page.locator('input[name="email"]').fill('rendi.nona@yopmail.com');
      await page.locator('input[name="password"]').fill('Password@123');
      await page.getByRole('button', { name: 'Masuk', exact: true }).click();

      const instruction = page.getByText('Lakukan perintah captcha dengan benar');
      await instruction.waitFor({ state: 'visible', timeout: 15000 });
      // tunggu skeleton captcha hilang
      await page.locator('[data-slot="skeleton"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(800);
      // webview captcha span kadang detached -> force click + retry
      const span = instruction.locator('span').first();
      await span.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
      await span.click({ force: true }).catch(async () => {
        await new Promise((r) => setTimeout(r, 800));
        await span.click({ force: true }).catch(() => {});
      });

      // Setelah captcha bypass, login langsung sukses (toast "Anda berhasil masuk!") tanpa dialog OTP.
      await expect(page.getByText('Pilih Jenis Layanan')).toBeVisible({ timeout: 25000 });

      await page.context().storageState({ path: '.auth/webview-nona.json' });
      console.log('setup login webview nona berhasil, session disimpan');
      return;
    } catch (e) {
      console.log(`setup login webview nona attempt ${attempt} gagal, retry...`, (e as Error).message);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error('Setup login webview nona gagal setelah retry');
});
