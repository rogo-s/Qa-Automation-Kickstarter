import { test, expect } from '@playwright/test';
import { BaBankPage } from '../../../shared/pages/BaBankPage';

/**
 * Master Data Bank - BOT BA (Biller Aggregator).
 * Pola CRUD sama dengan PPOB NONA: SEARCH/cek data dulu, baru eksekusi.
 * Catatan: search playground selalu "Tidak ada data" (bug), jadi cek data
 * dilakukan lewat scan tabel (lihat BaBankPage.hasRow).
 *
 * 1. Validasi form: Simpan disabled sampai kode & nama terisi
 * 2. Cek data ada/tidak -> bersihkan bila ada -> Tambah bank -> verifikasi
 * 3. Cek data ada -> Edit nama -> verifikasi
 * 4. Cek data ada -> Hapus (konfirmasi) -> verifikasi hilang
 * 5. Tambah dengan kode duplikat -> toast "Kode sudah digunakan"
 */
test.describe.configure({ mode: 'serial', timeout: 240000 });

const BANK_CODE = 'QABANK';
const BANK_NAME = 'QA BANK TES';
const BANK_NAME_EDITED = BANK_NAME + ' EDIT';

test.describe('BOT BA - Menu Bank @regression', () => {
  test('1. Validasi form tambah: Simpan disabled sampai field wajib terisi @smoke', async ({ page }) => {
    const bank = await BaBankPage.open(page);
    await bank.openAddBankForm();

    await expect(bank.isSaveDisabled()).resolves.toBeTruthy();

    await bank.fillForm({ code: BANK_CODE });
    await expect(bank.isSaveDisabled()).resolves.toBeTruthy();

    await bank.fillForm({ code: '', name: BANK_NAME });
    await expect(bank.isSaveDisabled()).resolves.toBeTruthy();

    await bank.fillForm({ code: BANK_CODE, name: BANK_NAME });
    await expect(bank.isSaveDisabled()).resolves.toBeFalsy();

    await bank.closeForm();
  });

  test('2. Search: cek data ada/tidak, lalu Tambah bank & verifikasi muncul @smoke', async ({ page }) => {
    const bank = await BaBankPage.open(page);

    // Cek dulu: bila sisa dari run sebelumnya, hapus supaya tidak duplikat.
    if (await bank.hasRow(BANK_CODE)) {
      await bank.deleteBank(BANK_CODE);
      await expect(bank.hasRow(BANK_CODE)).resolves.toBeFalsy();
    }

    await bank.openAddBankForm();
    await bank.fillForm({ code: BANK_CODE, name: BANK_NAME });
    await bank.save();

    // Dialog tertutup = berhasil disimpan
    await expect(bank.formDialog()).toHaveCount(0, { timeout: 10000 });
    await expect(bank.hasRow(BANK_CODE)).resolves.toBeTruthy();
    const row = bank.rowFor(BANK_CODE);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(BANK_NAME);
  });

  test('3. Search: verifikasi data ada, lalu Edit nama & verifikasi @smoke', async ({ page }) => {
    const bank = await BaBankPage.open(page);

    expect(await bank.hasRow(BANK_CODE)).toBeTruthy();

    await bank.openEditBankForm(BANK_CODE);
    await bank.fillForm({ name: BANK_NAME_EDITED });
    await bank.save();

    await expect(bank.formDialog()).toHaveCount(0, { timeout: 10000 });
    await expect(bank.hasRow(BANK_CODE)).resolves.toBeTruthy();
    const row = bank.rowFor(BANK_CODE);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(BANK_NAME_EDITED);
  });

  test('4. Search: verifikasi data ada, lalu Hapus dengan konfirmasi @smoke', async ({ page }) => {
    const bank = await BaBankPage.open(page);

    expect(await bank.hasRow(BANK_CODE)).toBeTruthy();

    await bank.deleteBank(BANK_CODE);

    await expect(bank.hasRow(BANK_CODE)).resolves.toBeFalsy();
  });

  test('5. Tambah dengan kode duplikat: toast "Kode sudah digunakan" muncul @smoke', async ({ page }) => {
    const bank = await BaBankPage.open(page);

    // Kode CIMB sudah ada di playground (data statis)
    await bank.openAddBankForm();
    await bank.fillForm({ code: 'CIMB', name: 'Bank Duplikat QA' });
    await bank.save();

    await expect(bank.page.getByText('Kode sudah digunakan').first()).toBeVisible({ timeout: 10000 });
    await bank.closeForm();

    // Pastikan data duplikat tidak bertambah: baris dengan nama tes tidak ada
    await expect(bank.hasRow('Bank Duplikat QA')).resolves.toBeFalsy();
  });
});
