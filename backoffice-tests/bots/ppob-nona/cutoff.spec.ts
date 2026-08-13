import { test, expect } from '@playwright/test';
import { PpobNonaCutoffPage } from '../../../shared/pages/PpobNonaCutoffPage';

/**
 * Master Data Cutoff - BOT PPOB NONA (session auth.setup.ts, webview via popup):
 * 1. Validasi form: Simpan disabled saat field belum lengkap &/ status switch unchecked
 * 2. Tambah cutoff tipe Daily (waktu mulai, durasi, Bank yang diterapkan = PSP exist) lalu verifikasi
 * 3. Edit cutoff (ganti Nama) lalu verifikasi
 * 4. Hapus data uji di test TERAKHIR (cleanup, tidak meninggalkan data)
 *
 * Catatan: "Bank yang diterapkan" di menu Cutoff bersumber dari data PSP (Nama Lengkap),
 * bukan dari menu Bank, jadi test memakai PSP yang sudah ada (Bank Mega) tanpa membuat baru.
 */
test.describe.configure({ mode: 'serial', timeout: 240000 });

const UNIQ = Date.now().toString().slice(-6);
const CUTOFF_NAME = 'QA CUTOFF ' + UNIQ;
const CUTOFF_CODE = 'QACUT' + UNIQ;
const EDITED_NAME = CUTOFF_NAME + 'X';

test.describe('BOT PPOB NONA - Menu Cutoff @regression', () => {
  test('1. Validasi form tambah: Simpan disabled sampai lengkap & status aktif @smoke', async ({ page }) => {
    const cutoff = await PpobNonaCutoffPage.open(page);
    await cutoff.openAddCutoffForm();

    await expect(cutoff.isSaveDisabled()).resolves.toBeTruthy();

    await cutoff.fillForm({ name: 'Cutoff Tes' });
    await expect(cutoff.isSaveDisabled()).resolves.toBeTruthy();

    await cutoff.fillForm({
      name: 'Cutoff Tes',
      code: 'CUTTES',
      type: 'Daily',
      time: '13:30:00',
      duration: '02:00:00',
      psp: 'Bank Mega',
    });
    // Semua field lengkap namun status switch masih unchecked -> tetap disabled
    await expect(cutoff.isSaveDisabled()).resolves.toBeTruthy();

    await cutoff.setStatus(true);
    await expect(cutoff.isSaveDisabled()).resolves.toBeFalsy();
  });

  test('2. Tambah cutoff tipe Daily lalu verifikasi muncul di tabel @smoke', async ({ page }) => {
    const cutoff = await PpobNonaCutoffPage.open(page);
    await cutoff.openAddCutoffForm();
    await cutoff.fillForm({
      name: CUTOFF_NAME,
      code: CUTOFF_CODE,
      type: 'Daily',
      time: '13:30:00',
      duration: '02:00:00',
      psp: 'Bank Mega',
    });
    await cutoff.setStatus(true);
    await cutoff.save();

    await expect(cutoff.hasRow(UNIQ)).resolves.toBeTruthy();
    const row = cutoff.rowFor(CUTOFF_NAME);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(CUTOFF_CODE);
    await expect(row).toContainText('DAILY');
    await expect(row).toContainText('13:30:00');
    await expect(row).toContainText('02:00:00');
    await expect(row).toContainText('Bank Mega');
    await expect(row).toContainText('Aktif');
  });

  test('3. Edit cutoff: ubah nama lalu verifikasi @smoke', async ({ page }) => {
    const cutoff = await PpobNonaCutoffPage.open(page);

    await cutoff.openEditCutoffForm(CUTOFF_NAME);
    await cutoff.fillForm({ name: EDITED_NAME });
    await cutoff.save();

    await expect(cutoff.hasRow(UNIQ)).resolves.toBeTruthy();
    const row = cutoff.rowFor(EDITED_NAME);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(CUTOFF_CODE);
    await expect(row).toContainText('Bank Mega');
  });

  test('4. Hapus data uji (cleanup) lalu verifikasi tidak ada di tabel @smoke', async ({ page }) => {
    const cutoff = await PpobNonaCutoffPage.open(page);

    await cutoff.deleteCutoff(EDITED_NAME);
  });
});