import { test, expect } from '@playwright/test';
import { BaTopupBankAccountPage } from '../../../shared/pages/BaTopupBankAccountPage';

/**
 * Master Data Topup Bank Account - BOT BA (Biller Aggregator).
 * Pola CRUD sama dengan PPOB NONA: SEARCH/cek data dulu, baru eksekusi.
 *
 * 1. Validasi form: Simpan disabled sampai nama + norek + deskripsi + bank terisi
 * 2. Cek data ada/tidak -> bersihkan -> Tambah rekening -> verifikasi
 * 3. Cek data ada -> Edit nama akun -> verifikasi
 * 4. Cek data ada -> Hapus (konfirmasi) -> verifikasi hilang
 * 5. Tambah dengan nomor rekening duplikat -> pesan "Nomor rekening sudah digunakan"
 */
test.describe.configure({ mode: 'serial', timeout: 300000 });

const ACC_NAME = 'QA REKENING TES';
const ACC_NAME_EDITED = ACC_NAME + ' EDIT';
const ACC_NUMBER = '7778889990';
const ACC_DESC = 'Rekening buatan QA';

test.describe('BOT BA - Menu Topup Bank Account @regression', () => {
  test('1. Validasi form tambah: Simpan disabled sampai field wajib terisi @smoke', async ({ page }) => {
    const tba = await BaTopupBankAccountPage.open(page);
    await tba.openAddForm();

    await expect(tba.isSaveDisabled()).resolves.toBeTruthy();

    await tba.fillForm({ accountName: ACC_NAME });
    await expect(tba.isSaveDisabled()).resolves.toBeTruthy();

    await tba.fillForm({ accountNumber: ACC_NUMBER });
    await expect(tba.isSaveDisabled()).resolves.toBeTruthy();

    await tba.fillForm({ description: ACC_DESC });
    await expect(tba.isSaveDisabled()).resolves.toBeFalsy();

    await tba.selectBank('CIMB');
    await expect(tba.isSaveDisabled()).resolves.toBeFalsy();

    await tba.closeForm();
  });

  test('2. Cek data ada/tidak, lalu Tambah rekening & verifikasi @smoke', async ({ page }) => {
    const tba = await BaTopupBankAccountPage.open(page);

    if (await tba.hasRow(ACC_NAME)) {
      await tba.deleteData(ACC_NAME);
      await expect(tba.hasRow(ACC_NAME)).resolves.toBeFalsy();
    }

    await tba.openAddForm();
    await tba.fillForm({ accountName: ACC_NAME, accountNumber: ACC_NUMBER, description: ACC_DESC });
    await tba.selectBank('CIMB');
    await tba.save();

    await expect(tba.formDialog()).toHaveCount(0, { timeout: 10000 });
    await expect(tba.hasRow(ACC_NUMBER)).resolves.toBeTruthy();
    const row = tba.rowFor(ACC_NUMBER);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(ACC_NAME);
    await expect(row).toContainText('CIMB');
  });

  test('3. Cek data ada, lalu Edit nama akun & verifikasi @smoke', async ({ page }) => {
    const tba = await BaTopupBankAccountPage.open(page);

    expect(await tba.hasRow(ACC_NUMBER)).toBeTruthy();

    await tba.openEditForm(ACC_NUMBER);
    await tba.fillForm({ accountName: ACC_NAME_EDITED });
    await tba.save();

    await expect(tba.formDialog()).toHaveCount(0, { timeout: 10000 });
    await expect(tba.hasRow(ACC_NUMBER)).resolves.toBeTruthy();
    await expect(tba.rowFor(ACC_NUMBER)).toContainText(ACC_NAME_EDITED);
  });

  test('4. Cek data ada, lalu Hapus dengan konfirmasi @smoke', async ({ page }) => {
    const tba = await BaTopupBankAccountPage.open(page);

    expect(await tba.hasRow(ACC_NUMBER)).toBeTruthy();

    await tba.deleteData(ACC_NUMBER);

    await expect(tba.hasRow(ACC_NUMBER)).resolves.toBeFalsy();
  });

  test('5. Tambah dengan nomor rekening duplikat: pesan "Nomor rekening sudah digunakan" @smoke', async ({ page }) => {
    const tba = await BaTopupBankAccountPage.open(page);

    await tba.openAddForm();
    await tba.fillForm({ accountName: 'QA DUP TES', accountNumber: '782458724578', description: 'Duplikat' });
    await tba.selectBank('CIMB');
    await tba.save();

    await expect(tba.page.getByText('Nomor rekening sudah digunakan').first()).toBeVisible({ timeout: 10000 });
    await tba.closeForm();
    await expect(tba.hasRow('QA DUP TES')).resolves.toBeFalsy();
  });
});
