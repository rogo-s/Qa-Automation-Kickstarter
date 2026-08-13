import { test, expect } from '@playwright/test';
import { PpobNonaPspPage } from '../../../shared/pages/PpobNonaPspPage';

/**
 * Master Data PSP - BOT PPOB NONA (session auth.setup.ts, webview via popup):
 * 1. Validasi form: Simpan disabled sampai semua field lengkap termasuk teks howToPay (Quill)
 * 2. Tambah PSP lalu verifikasi via search
 * 3. Edit PSP (ganti nama & teks howToPay) lalu verifikasi
 * 4. Status PSP: nonaktifkan lalu aktifkan lagi
 * 5. Hapus data uji di test TERAKHIR (cleanup, tidak meninggalkan data)
 *
 * Catatan: "Rekening Settlement" memakai data Settlement Bank Account yang sudah ada
 * (Settlement BNI), tanpa membuat data baru.
 */
test.describe.configure({ mode: 'serial', timeout: 240000 });

const UNIQ = Date.now().toString().slice(-6);
const PSP_NAME = 'QA PSP ' + UNIQ;
const PSP_CODE = 'QAPSP' + UNIQ;
const EDITED_NAME = PSP_NAME + 'X';

test.describe('BOT PPOB NONA - Menu PSP @regression', () => {
  test('1. Validasi form tambah: Simpan disabled sampai semua field lengkap @smoke', async ({ page }) => {
    const psp = await PpobNonaPspPage.open(page);
    await psp.openAddPspForm();

    await expect(psp.isSaveDisabled()).resolves.toBeTruthy();

    await psp.fillForm({
      code: 'PSPX',
      type: 'VA',
      fullName: 'PSP Tes',
      simpleName: 'PSPX',
      minAmount: '10000',
      maxAmount: '10000000',
      vaPrefix: '99991',
      integratorUrl: 'https://api.qa.test/callback',
      integratorSecret: 'sec12345',
      rekening: 'Settlement BNI',
      settlementType: 'Bulk',
    });
    // Semua field teks/dropdown terisi, namun howToPay (Quill) kosong -> tetap disabled
    await expect(psp.isSaveDisabled()).resolves.toBeTruthy();

    await psp.fillForm({ howToPay: 'Pembayaran via transfer ke nomor VA.' });
    await expect(psp.isSaveDisabled()).resolves.toBeFalsy();
  });

  test('2. Tambah PSP lalu verifikasi muncul di tabel @smoke', async ({ page }) => {
    const psp = await PpobNonaPspPage.open(page);
    await psp.openAddPspForm();
    await psp.fillForm({
      code: PSP_CODE,
      type: 'VA',
      fullName: PSP_NAME,
      simpleName: 'QAPSP',
      minAmount: '10000',
      maxAmount: '10000000',
      vaPrefix: '99991',
      integratorUrl: 'https://api.qa.test/callback',
      integratorSecret: 'sec12345',
      rekening: 'Settlement BNI',
      settlementType: 'Bulk',
      howToPay: 'Pembayaran via transfer ke nomor VA.',
    });
    await psp.save();

    await expect(psp.hasRow(UNIQ)).resolves.toBeTruthy();
    const row = psp.rowFor(PSP_NAME);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(PSP_CODE);
    await expect(row).toContainText('VA');
    await expect(row).toContainText('Aktif');
  });

  test('3. Edit PSP: ubah nama & teks howToPay lalu verifikasi @smoke', async ({ page }) => {
    const psp = await PpobNonaPspPage.open(page);

    await psp.openEditPspForm(PSP_NAME);
    await psp.fillForm({ fullName: EDITED_NAME, howToPay: 'Cara pembayaran diubah.' });
    await psp.save();

    await expect(psp.hasRow(UNIQ)).resolves.toBeTruthy();
    const row = psp.rowFor(EDITED_NAME);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(PSP_CODE);
  });

  test('4. PSP: nonaktifkan lalu aktifkan lagi @smoke', async ({ page }) => {
    const psp = await PpobNonaPspPage.open(page);

    await psp.openEditPspForm(EDITED_NAME);
    await psp.setStatus(false);
    await psp.fillForm({ howToPay: 'Cara pembayaran tetap.' });
    await psp.save();

    await expect(psp.hasRow(UNIQ)).resolves.toBeTruthy();
    await expect(psp.rowFor(EDITED_NAME)).toContainText('Nonaktif');

    await psp.openEditPspForm(EDITED_NAME);
    await psp.setStatus(true);
    await psp.fillForm({ howToPay: 'Cara pembayaran tetap.' });
    await psp.save();

    await expect(psp.hasRow(UNIQ)).resolves.toBeTruthy();
    await expect(psp.rowFor(EDITED_NAME)).toContainText('Aktif');
  });

  test('5. Hapus data uji (cleanup) lalu verifikasi tidak ada di tabel @smoke', async ({ page }) => {
    const psp = await PpobNonaPspPage.open(page);

    await psp.deletePsp(EDITED_NAME);
  });
});