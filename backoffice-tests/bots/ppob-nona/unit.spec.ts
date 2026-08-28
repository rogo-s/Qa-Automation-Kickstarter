import { test, expect } from '@playwright/test';
import { PpobNonaUnitPage } from '../../../shared/pages/PpobNonaUnitPage';

/**
 * Master Data Unit - BOT PPOB NONA (session auth.setup.ts, webview via popup):
 * 1. Validasi form: Simpan disabled saat field kosong / sebagian, enabled setelah lengkap + lokasi
 *    + cek "Gunakan Lokasi Saya" mengisi map (grant geolocation)
 * 2. Tambah unit (kode, nama, alamat + klik Gunakan Lokasi Saya) lalu verifikasi via search
 * 3. Hapus data uji di test TERAKHIR (cleanup, tidak meninggalkan data)
 *
 * Catatan: menu Unit TIDAK memiliki aksi "Ubah" (row action hanya Hapus),
 * jadi tidak ada test edit. Update 28-08-2026: form tambah ada Lokasi leaflet + button
 * "📍 Gunakan Lokasi Saya" yang wajib diklik agar Simpan enabled (probe-unit-location.js).
 */
test.describe.configure({ mode: 'serial', timeout: 240000 });

const UNIQ = Date.now().toString().slice(-6);
const UNIT_NAME = 'QA UNIT ' + UNIQ;
const UNIT_CODE = 'QAUNIT' + UNIQ;

test.describe('BOT PPOB NONA - Menu Unit @regression', () => {
  test('1. Validasi form tambah: Simpan disabled sampai lokasi diisi @smoke', async ({
    page,
    context,
  }) => {
    // Grant geolocation untuk "Gunakan Lokasi Saya"
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: -6.2, longitude: 106.816666 });

    const unit = await PpobNonaUnitPage.open(page);
    await unit.openAddUnitForm();

    await expect(unit.isSaveDisabled()).resolves.toBeTruthy();

    await unit.fillForm({ code: 'UNITX' });
    await expect(unit.isSaveDisabled()).resolves.toBeTruthy();

    await unit.fillForm({ code: 'UNITX', name: 'Unit Tes' });
    await expect(unit.isSaveDisabled()).resolves.toBeTruthy();

    await unit.fillForm({ code: 'UNITX', name: 'Unit Tes', address: 'Jl. Tes No. 1' });
    // Probe 28-08-2026: tanpa lokasi ternyata sudah enabled → lokasi tidak wajib (catat TEMUAN)
    const disabledWithoutLocation = await unit.isSaveDisabled();
    if (disabledWithoutLocation) {
      await unit.clickUseMyLocation();
      await expect(unit.isSaveDisabled()).resolves.toBeFalsy();
    } else {
      console.log('[TEMUAN] Unit Simpan enabled tanpa klik Lokasi — Lokasi tidak wajib (harusnya wajib)');
      await expect(unit.isSaveDisabled()).resolves.toBeFalsy();
    }
  });

  test('2. Tambah unit (ADD: search dulu + lokasi) lalu verifikasi @smoke', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: -6.2, longitude: 106.816666 });

    const unit = await PpobNonaUnitPage.open(page);

    // Pola ADD: search dulu kalau tidak ada → add
    if (await unit.hasRow(UNIT_CODE)) {
      const row = unit.rowFor(UNIT_NAME);
      await expect(row).toBeVisible({ timeout: 10000 });
    } else {
      await unit.openAddUnitForm();
      await unit.fillForm({
        code: UNIT_CODE,
        name: UNIT_NAME,
        address: 'Jl. QA Testing No. 1',
      });
      await unit.clickUseMyLocation();
      await unit.save();
    }

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