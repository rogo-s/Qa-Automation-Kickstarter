import { test, expect } from '@playwright/test';
import { PpobNonaBankPage } from '../../../shared/pages/PpobNonaBankPage';

/**
 * Master Data Bank - BOT PPOB NONA (session auth.setup.ts, webview via popup):
 * 1. Validasi form: Simpan disabled saat field kosong / sebagian, enabled saat semua terisi
 * 2. Tambah bank lalu verifikasi via search
 * 3. Edit bank (ganti Nama Singkat & Kode SWIFT) lalu verifikasi
 * 4. Hapus bank lalu verifikasi tidak ada di tabel
 */
test.describe.configure({ mode: 'serial', timeout: 240000 });

const BANK_NAME = 'QA BANK ' + Date.now().toString().slice(-6);
const UNIQ = Date.now().toString().slice(-5);

test.describe('BOT PPOB NONA - Menu Bank @regression', () => {
  test('1. Validasi form tambah: Simpan disabled saat tidak lengkap @smoke', async ({ page }) => {
    const bank = await PpobNonaBankPage.open(page);
    await bank.openAddBankForm();

    await expect(bank.isSaveDisabled()).resolves.toBeTruthy();

    await bank.fillForm({ name: 'Bank Tes' });
    await expect(bank.isSaveDisabled()).resolves.toBeTruthy();

    await bank.fillForm({ name: 'Bank Tes', code: 'TES' });
    await expect(bank.isSaveDisabled()).resolves.toBeTruthy();

    await bank.fillForm({ name: 'Bank Tes', code: 'TES', shortName: 'TES' });
    await expect(bank.isSaveDisabled()).resolves.toBeTruthy();

    await bank.fillForm({ name: 'Bank Tes', code: 'TES', shortName: 'TES', swiftCode: 'TESTIDJ1' });
    await expect(bank.isSaveDisabled()).resolves.toBeFalsy();
  });

  test('2. Tambah bank lalu verifikasi muncul di tabel @smoke', async ({ page }) => {
    const bank = await PpobNonaBankPage.open(page);
    await bank.openAddBankForm();
    await bank.fillForm({
      name: BANK_NAME,
      code: 'QA' + UNIQ,
      shortName: 'QAB',
      swiftCode: 'QABCIDJ1',
    });
    await bank.save();

    await expect(bank.hasRow(BANK_NAME)).resolves.toBeTruthy();
    const row = bank.rowFor(BANK_NAME);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText('QA' + UNIQ);
  });

  test('3. Edit bank: ubah Nama Singkat & Kode SWIFT lalu verifikasi @smoke', async ({ page }) => {
    const bank = await PpobNonaBankPage.open(page);

    await bank.openEditBankForm(BANK_NAME);
    await bank.fillForm({ shortName: 'QAB2', swiftCode: 'QABCIDJ2' });
    await bank.save();

    await expect(bank.hasRow(BANK_NAME)).resolves.toBeTruthy();
    const row = bank.rowFor(BANK_NAME);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText('QAB2');
    await expect(row).toContainText('QABCIDJ2');
  });

  test('4. Hapus bank lalu verifikasi tidak ada di tabel @smoke', async ({ page }) => {
    const bank = await PpobNonaBankPage.open(page);

    await bank.deleteBank(BANK_NAME);

    await expect(bank.hasRow(BANK_NAME)).resolves.toBeFalsy();
  });
});