import { test, expect } from '@playwright/test';
import { PpobNonaSettingsPage } from '../../../shared/pages/PpobNonaSettingsPage';

/**
 * Master Data Settings - BOT PPOB NONA (session auth.setup.ts, webview via popup):
 * 1. Validasi form: Simpan disabled saat field kosong / sebagian, enabled saat lengkap
 *    + cek value bebas string (catat bug jika string lolos, harusnya numeric/Rp)
 * 2. Tambah settings (ADD: search dulu kalau tidak ada → add) lalu verifikasi via search
 * 3. Edit settings (search kalau ada → ubah value/description) lalu verifikasi
 * 4. Hapus settings (search kalau ada → hapus) lalu verifikasi tidak ada
 *
 * Catatan:
 *  - Settings dipakai untuk transaction suspect (MAX_ADDITIONAL_AMOUNT dll).
 *  - Gunakan RULE_CODE unik QA_SETT_<uniq> agar tidak bentrok data existing.
 *  - Tipe CRUD penuh: Ubah / Hapus via Open menu.
 */
test.describe.configure({ mode: 'serial', timeout: 240000 });

const UNIQ = Date.now().toString().slice(-6);
const RULE_CODE = 'QASETT' + UNIQ;
const VALUE = '15000';
const EDITED_VALUE = '25000';
const DESCRIPTION = 'QA Settings for transaction suspect';
const EDITED_DESC = DESCRIPTION + ' updated';

test.describe('BOT PPOB NONA - Menu Settings @regression', () => {
  test('1. Validasi form tambah: Simpan disabled saat tidak lengkap & cek tipe value @smoke', async ({
    page,
  }) => {
    const settings = await PpobNonaSettingsPage.open(page);
    await settings.openAddSettingsForm();

    // Kosong → disabled
    await expect(settings.isSaveDisabled()).resolves.toBeTruthy();

    // Hanya rule_code → tetap disabled
    await settings.fillForm({ ruleCode: 'TESTCODE' });
    await expect(settings.isSaveDisabled()).resolves.toBeTruthy();

    // rule_code + value (tanpa deskripsi) → tetap disabled (deskripsi wajib)
    await settings.fillForm({ ruleCode: 'TESTCODE', value: VALUE });
    await expect(settings.isSaveDisabled()).resolves.toBeTruthy();

    // Lengkap → enabled
    await settings.fillForm({ ruleCode: 'TESTCODE', value: VALUE, description: DESCRIPTION });
    await expect(settings.isSaveDisabled()).resolves.toBeFalsy();

    // Validasi tipe value: coba isi string bebas "abc" — jika tetap enabled, catat sebagai temuan
    // (harusnya numeric/Rp). Tidak fail, hanya log untuk bug report.
    await settings.fillForm({ value: 'abc' });
    const enabledWithString = !(await settings.isSaveDisabled());
    if (enabledWithString) {
      console.log(
        '[TEMUAN] Settings value menerima string bebas "abc" dan Simpan enabled — harusnya hanya numeric/Rp',
      );
    }
    // kembalikan ke numeric agar tidak mengganggu test berikutnya (close form)
    await settings.fillForm({ value: VALUE });
    await expect(settings.isSaveDisabled()).resolves.toBeFalsy();
  });

  test('2. Tambah settings (ADD: search dulu kalau tidak ada) lalu verifikasi @smoke', async ({
    page,
  }) => {
    const settings = await PpobNonaSettingsPage.open(page);

    // Pola ADD: search dulu, kalau sudah ada skip add (hindari duplikat)
    if (await settings.hasRow(RULE_CODE)) {
      const row = settings.rowFor(RULE_CODE);
      await expect(row).toBeVisible({ timeout: 10000 });
      await expect(row).toContainText(RULE_CODE);
    } else {
      await settings.openAddSettingsForm();
      await settings.fillForm({
        ruleCode: RULE_CODE,
        value: VALUE,
        description: DESCRIPTION,
      });
      await settings.setStatus(true);
      await settings.save();
    }

    await expect(settings.hasRow(RULE_CODE)).resolves.toBeTruthy();
    const row = settings.rowFor(RULE_CODE);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(RULE_CODE);
    // Value tampil format Rupiah "Rp15.000" (temu NONA-001)
    await expect(row).toContainText(/15\.000/);
    await expect(row).toContainText('Aktif');
  });

  test('3. Edit settings (search kalau ada -> ubah value) lalu verifikasi @smoke', async ({
    page,
  }) => {
    const settings = await PpobNonaSettingsPage.open(page);

    await settings.openEditSettingsForm(RULE_CODE);
    await settings.fillForm({ value: EDITED_VALUE, description: EDITED_DESC });
    await settings.save();

    await expect(settings.hasRow(RULE_CODE)).resolves.toBeTruthy();
    const row = settings.rowFor(RULE_CODE);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(/25\.000/);
  });

  test('4. Hapus settings (search kalau ada → hapus) lalu verifikasi tidak ada @smoke', async ({
    page,
  }) => {
    const settings = await PpobNonaSettingsPage.open(page);

    // Pola DELETE: search dulu kalau ada -> hapus
    if (await settings.hasRow(RULE_CODE)) {
      await settings.deleteSettings(RULE_CODE);
    }

    await expect(settings.hasRow(RULE_CODE)).resolves.toBeFalsy();
  });
});
