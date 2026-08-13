import { test, expect } from '@playwright/test';
import { PpobNonaUnitPage } from '../../../shared/pages/PpobNonaUnitPage';

/**
 * Master Data Unit - BOT PPOB NONA (session auth.setup.ts, webview via popup):
 * 1. Validasi form: Simpan disabled saat field kosong / sebagian, enabled saat lengkap
 * 2. Tambah unit (kode, nama, alamat) lalu verifikasi via search
 * 3. Hapus data uji di test TERAKHIR (cleanup, tidak meninggalkan data)
 *
 * Catatan: menu Unit TIDAK memiliki aksi "Ubah" (row action hanya Hapus),
 * jadi tidak ada test edit seperti menu lainnya.
 */
test.describe.configure({ mode: 'serial', timeout: 240000 });

const UNIQ = Date.now().toString().slice(-6);
const UNIT_NAME = 'QA UNIT ' + UNIQ;
const UNIT_CODE = 'QAUNIT' + UNIQ;

test.describe('BOT PPOB NONA - Menu Unit @regression', () => {
  test('1. Validasi form tambah: Simpan disabled saat tidak lengkap @smoke', async ({ page }) => {
    const unit = await PpobNonaUnitPage.open(page);
    await unit.openAddUnitForm();

    await expect(unit.isSaveDisabled()).resolves.toBeTruthy();

    await unit.fillForm({ code: 'UNITX' });
    await expect(unit.isSaveDisabled()).resolves.toBeTruthy();

    await unit.fillForm({ code: 'UNITX', name: 'Unit Tes' });
    await expect(unit.isSaveDisabled()).resolves.toBeTruthy();

    await unit.fillForm({ code: 'UNITX', name: 'Unit Tes', address: 'Jl. Tes No. 1' });
    await expect(unit.isSaveDisabled()).resolves.toBeFalsy();
  });

  test('2. Tambah unit lalu verifikasi muncul di tabel @smoke', async ({ page }) => {
    const unit = await PpobNonaUnitPage.open(page);
    await unit.openAddUnitForm();
    await unit.fillForm({
      code: UNIT_CODE,
      name: UNIT_NAME,
      address: 'Jl. QA Testing No. 1',
    });
    await unit.save();

    await expect(unit.hasRow(UNIQ)).resolves.toBeTruthy();
    const row = unit.rowFor(UNIT_NAME);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(UNIT_CODE);
    await expect(row).toContainText('Jl. QA Testing No. 1');
    await expect(row).toContainText('Aktif');
  });

  test('3. Hapus data uji (cleanup) lalu verifikasi tidak ada di tabel @smoke', async ({ page }) => {
    const unit = await PpobNonaUnitPage.open(page);

    await unit.deleteUnit(UNIT_NAME);
  });
});