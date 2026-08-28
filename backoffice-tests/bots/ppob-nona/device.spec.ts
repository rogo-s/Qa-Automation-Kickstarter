import { test, expect } from '@playwright/test';
import { PpobNonaDevicePage } from '../../../shared/pages/PpobNonaDevicePage';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

/**
 * Master Data Device - BOT PPOB NONA (session auth.setup.ts, webview via popup):
 * 1. Validasi form: Simpan disabled sampai name+unit+file qr terisi
 * 2. Tambah device (ADD: search dulu kalau tidak ada) + pilih Unit + upload dummy .txt (catat bug jika lolos) lalu verifikasi
 * 3. Edit device (search kalau ada → ubah nama) lalu verifikasi
 * 4. Hapus device (search kalau ada → hapus) lalu verifikasi tidak ada
 *
 * Note: Device butuh Unit exist (pakai "Cabang Bandung" UNIT002 yang sudah ada).
 */
test.describe.configure({ mode: 'serial', timeout: 240000 });

const UNIQ = Date.now().toString().slice(-6);
const DEVICE_NAME = 'QA DEVICE ' + UNIQ;
const EDITED_NAME = DEVICE_NAME + ' X';
const UNIT_NAME = 'Cabang Bandung'; // existing di probe-ppob-detail.js:30

function makeDummyQr(ext: 'png' | 'txt' = 'png'): string {
  const dir = join(tmpdir(), 'ppob-nona-device');
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `qr-${UNIQ}.${ext}`);
  // minimal png header dummy (untuk lolos accept .jpg/.jpeg/.png)
  const content = ext === 'png' ? Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) : 'dummy qr';
  writeFileSync(path, content);
  return path;
}

test.describe('BOT PPOB NONA - Menu Device @regression', () => {
  test('1. Validasi form tambah: Simpan disabled sampai lengkap @smoke', async ({ page }) => {
    const device = await PpobNonaDevicePage.open(page);
    await device.openAddForm();

    await expect(device.isSaveDisabled()).resolves.toBeTruthy();

    await device.fillForm({ name: 'Device Tes' });
    await expect(device.isSaveDisabled()).resolves.toBeTruthy();

    await device.selectUnit(UNIT_NAME);
    await expect(device.isSaveDisabled()).resolves.toBeTruthy();

    // tanpa file masih disabled
    // coba upload .txt (harusnya tidak diterima, Simpan tetap disabled)
    const dummyTxt = makeDummyQr('txt');
    await device.uploadQr(dummyTxt);
    const enabledWithTxt = !(await device.isSaveDisabled());
    if (enabledWithTxt) {
      console.log('[TEMUAN] Device menerima .txt untuk QR dan Simpan enabled — seharusnya hanya jpg/png');
    } else {
      console.log('[INFO] Device menolak .txt (Simpan tetap disabled) — valid');
    }

    // upload valid png harus enabled
    const dummyPng = makeDummyQr('png');
    await device.uploadQr(dummyPng);
    await expect(device.isSaveDisabled()).resolves.toBeFalsy();
  });

  test('2. Tambah device (ADD: search dulu) lalu verifikasi @smoke', async ({ page }) => {
    const device = await PpobNonaDevicePage.open(page);

    if (await device.hasRow(DEVICE_NAME)) {
      const row = device.rowFor(DEVICE_NAME);
      await expect(row).toBeVisible({ timeout: 10000 });
    } else {
      await device.openAddForm();
      await device.fillForm({ name: DEVICE_NAME });
      await device.selectUnit(UNIT_NAME);
      const dummyPng = makeDummyQr('png');
      await device.uploadQr(dummyPng);
      await device.save();
    }

    await expect(device.hasRow(DEVICE_NAME)).resolves.toBeTruthy();
    const row = device.rowFor(DEVICE_NAME);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(DEVICE_NAME);
    await expect(row).toContainText(UNIT_NAME);
  });

  test('3. Edit device (search kalau ada → ubah nama) lalu verifikasi @smoke', async ({ page }) => {
    const device = await PpobNonaDevicePage.open(page);

    await device.openEditForm(DEVICE_NAME);
    await device.fillForm({ name: EDITED_NAME });
    await device.save();

    await expect(device.hasRow(EDITED_NAME)).resolves.toBeTruthy();
    const row = device.rowFor(EDITED_NAME);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(EDITED_NAME);
  });

  test('4. Hapus device (search kalau ada → hapus) lalu verifikasi tidak ada @smoke', async ({ page }) => {
    const device = await PpobNonaDevicePage.open(page);

    const target = EDITED_NAME; // hasil edit
    if (await device.hasRow(target)) {
      await device.deleteDevice(target);
    } else if (await device.hasRow(DEVICE_NAME)) {
      await device.deleteDevice(DEVICE_NAME);
    }

    await expect(device.hasRow(EDITED_NAME)).resolves.toBeFalsy();
    await expect(device.hasRow(DEVICE_NAME)).resolves.toBeFalsy();
  });
});
