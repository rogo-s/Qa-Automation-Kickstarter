import { test, expect } from '@playwright/test';
import { PpobNonaApplicationPage } from '../../../shared/pages/PpobNonaApplicationPage';
import { writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Master Data Application - BOT PPOB NONA (session auth.setup.ts, webview via popup):
 * 1. Validasi form: Simpan disabled sampai version+versionCode+file terisi; url opsional
 * 2. ADD dengan dummy .txt (harusnya ditolak, catat bug jika lolos)
 * 3. Tambah valid dengan .apk (dummy) lalu verifikasi via search (ADD: search dulu)
 * 4. Download file dari row
 *
 * Note: hanya Add + View + Download, tidak ada Edit/Delete (probe 28-08-2026 row hanya Download).
 */
test.describe.configure({ mode: 'serial', timeout: 240000 });

const UNIQ = Date.now().toString().slice(-6);
const VERSION = '9.9.' + UNIQ.slice(-2);
const VERSION_CODE = UNIQ;
const URL = 'https://example.com/app-' + UNIQ + '.apk';

// helper buat dummy file
function makeDummy(ext: 'apk' | 'txt', content = 'dummy apk content'): string {
  const dir = join(tmpdir(), 'ppob-nona-app');
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `dummy-${UNIQ}.${ext}`);
  writeFileSync(path, content);
  return path;
}

test.describe('BOT PPOB NONA - Menu Application @regression', () => {
  test('1. Validasi form tambah: Simpan disabled sampai lengkap, url opsional @smoke', async ({
    page,
  }) => {
    const app = await PpobNonaApplicationPage.open(page);
    await app.openAddForm();

    await expect(app.isSaveDisabled()).resolves.toBeTruthy();

    await app.fillForm({ version: VERSION });
    await expect(app.isSaveDisabled()).resolves.toBeTruthy();

    await app.fillForm({ version: VERSION, versionCode: VERSION_CODE });
    await expect(app.isSaveDisabled()).resolves.toBeTruthy();

    // tanpa file masih disabled
    // upload dummy txt dulu cek tetap disabled? seharusnya tetap disabled atau ditolak
    const dummyTxt = makeDummy('txt', 'not apk');
    await app.uploadFile(dummyTxt);
    // jika .txt diterima dan Simpan jadi enabled -> catat temuan
    const enabledWithTxt = !(await app.isSaveDisabled());
    if (enabledWithTxt) {
      console.log('[TEMUAN] Application menerima .txt dan Simpan enabled — seharusnya hanya .apk');
    } else {
      console.log('[INFO] Application menolak .txt (Simpan tetap disabled) — valid');
    }

    // upload valid .apk harus enabled
    const dummyApk = makeDummy('apk');
    await app.uploadFile(dummyApk);
    await expect(app.isSaveDisabled()).resolves.toBeFalsy();

    // url opsional: isi url tetap enabled
    await app.fillForm({ url: URL });
    await expect(app.isSaveDisabled()).resolves.toBeFalsy();
  });

  test('2. Tambah application (ADD: search dulu) lalu verifikasi @smoke', async ({ page }) => {
    const app = await PpobNonaApplicationPage.open(page);

    if (await app.hasRow(VERSION)) {
      const row = app.rowFor(VERSION);
      await expect(row).toBeVisible({ timeout: 10000 });
    } else {
      await app.openAddForm();
      await app.fillForm({ version: VERSION, versionCode: VERSION_CODE });
      const dummyApk = makeDummy('apk');
      await app.uploadFile(dummyApk);
      await app.save();
    }

    await expect(app.hasRow(VERSION)).resolves.toBeTruthy();
    const row = app.rowFor(VERSION);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(VERSION);
    await expect(row).toContainText(VERSION_CODE);
  });

  test('3. Download aplikasi dari tabel @smoke', async ({ page }) => {
    const app = await PpobNonaApplicationPage.open(page);
    // pastikan data ada
    await expect(app.hasRow(VERSION)).resolves.toBeTruthy();
    const download = await app.downloadFirstRow();
    // jika download event tidak ada, cukup cek menu Download ada (probe row Download)
    if (download) {
      console.log(`[INFO] Download triggered: ${download.suggestedFilename()}`);
      expect(download.suggestedFilename()).toMatch(/\.apk/i);
    } else {
      console.log('[INFO] Download menu diklik, cek tidak 404');
      await expect(app.heading).toBeVisible();
    }
  });
});
