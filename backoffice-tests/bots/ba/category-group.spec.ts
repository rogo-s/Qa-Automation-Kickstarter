import { test, expect } from '@playwright/test';
import { BaCategoryGroupPage } from '../../../shared/pages/BaCategoryGroupPage';

/**
 * Master Data Kategori dan Grup - BOT BA (Biller Aggregator).
 * Pola CRUD sama dengan PPOB NONA: SEARCH/cek data dulu, baru eksekusi.
 * Dua tab (Kategori & Grup) memakai struktur form identik.
 *
 * Kategori:
 * 1. Validasi form: Simpan disabled sampai nama + kode + deskripsi terisi
 * 2. Cek data ada/tidak -> bersihkan -> Tambah kategori (status Aktif) -> verifikasi
 * 3. Cek data ada -> Edit nama -> verifikasi
 * 4. Cek data ada -> Nonaktifkan lalu aktifkan lagi -> verifikasi status
 * 5. Cek data ada -> Hapus (konfirmasi) -> verifikasi hilang
 * 6. Tambah dengan kode duplikat -> pesan "... sudah digunakan"
 *
 * Grup:
 * 7. Cek data -> bersihkan -> Tambah grup -> verifikasi
 * 8. Cek data -> Edit grup -> verifikasi
 * 9. Cek data -> Hapus grup -> verifikasi hilang
 */
test.describe.configure({ mode: 'serial', timeout: 360000 });

const KAT_NAME = 'QA KATEGORI TES';
const KAT_NAME_EDITED = KAT_NAME + ' EDIT';
const KAT_CODE = 'QAKAT';
const KAT_DESC = 'Kategori buatan QA';

const GRP_NAME = 'QA GRUP TES';
const GRP_NAME_EDITED = GRP_NAME + ' EDIT';
const GRP_CODE = 'QAGRP';
const GRP_DESC = 'Grup buatan QA';

test.describe('BOT BA - Menu Kategori dan Grup @regression', () => {
  test('1. Validasi form tambah Kategori: Simpan disabled sampai field wajib terisi @smoke', async ({ page }) => {
    const cg = await BaCategoryGroupPage.open(page);
    await cg.openAddForm('Kategori');

    await expect(cg.isSaveDisabled()).resolves.toBeTruthy();

    await cg.fillForm({ name: KAT_NAME });
    await expect(cg.isSaveDisabled()).resolves.toBeTruthy();

    await cg.fillForm({ code: KAT_CODE });
    await expect(cg.isSaveDisabled()).resolves.toBeTruthy();

    await cg.fillForm({ description: KAT_DESC });
    await expect(cg.isSaveDisabled()).resolves.toBeFalsy();

    await cg.closeForm();
  });

  test('2. Cek data Kategori ada/tidak, lalu Tambah & verifikasi @smoke', async ({ page }) => {
    const cg = await BaCategoryGroupPage.open(page);

    if (await cg.hasRow(KAT_NAME)) {
      await cg.deleteData(KAT_NAME);
      await expect(cg.hasRow(KAT_NAME)).resolves.toBeFalsy();
    }

    await cg.openAddForm('Kategori');
    await cg.fillForm({ name: KAT_NAME, code: KAT_CODE, description: KAT_DESC });
    await cg.setStatus(true);
    await cg.save();

    await expect(cg.formDialog()).toHaveCount(0, { timeout: 10000 });
    await expect(cg.hasRow(KAT_CODE)).resolves.toBeTruthy();
    const row = cg.rowFor(KAT_CODE);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(KAT_NAME);
    await expect(row).toContainText('Aktif');
  });

  test('3. Cek data Kategori ada, lalu Edit nama & verifikasi @smoke', async ({ page }) => {
    const cg = await BaCategoryGroupPage.open(page);

    expect(await cg.hasRow(KAT_CODE)).toBeTruthy();

    await cg.openEditForm(KAT_CODE);
    await cg.fillForm({ name: KAT_NAME_EDITED });
    await cg.save();

    await expect(cg.formDialog()).toHaveCount(0, { timeout: 10000 });
    await expect(cg.hasRow(KAT_CODE)).resolves.toBeTruthy();
    const row = cg.rowFor(KAT_CODE);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(KAT_NAME_EDITED);
  });

  test('4. Cek data Kategori ada, lalu nonaktifkan & aktifkan lagi @smoke', async ({ page }) => {
    const cg = await BaCategoryGroupPage.open(page);

    expect(await cg.hasRow(KAT_CODE)).toBeTruthy();

    await cg.openEditForm(KAT_CODE);
    await cg.setStatus(false);
    await cg.save();
    await expect(cg.hasRow(KAT_CODE)).resolves.toBeTruthy();
    await expect(cg.rowFor(KAT_CODE)).toContainText('Tidak Aktif');

    await cg.openEditForm(KAT_CODE);
    await cg.setStatus(true);
    await cg.save();
    await expect(cg.hasRow(KAT_CODE)).resolves.toBeTruthy();
    await expect(cg.rowFor(KAT_CODE)).toContainText('Aktif');
  });

  test('5. Cek data Kategori ada, lalu Hapus dengan konfirmasi @smoke', async ({ page }) => {
    const cg = await BaCategoryGroupPage.open(page);

    expect(await cg.hasRow(KAT_CODE)).toBeTruthy();

    await cg.deleteData(KAT_CODE);

    await expect(cg.hasRow(KAT_CODE)).resolves.toBeFalsy();
  });

  test('6. Tambah Kategori dengan kode duplikat: pesan "sudah digunakan" muncul @smoke', async ({ page }) => {
    const cg = await BaCategoryGroupPage.open(page);

    await cg.openAddForm('Kategori');
    await cg.fillForm({ name: 'QA DUP TES', code: 'TELCO-DATA', description: 'Duplikat' });
    await cg.save();

    await expect(cg.page.getByText(/sudah digunakan/).first()).toBeVisible({ timeout: 10000 });
    await cg.closeForm();
    await expect(cg.hasRow('QA DUP TES')).resolves.toBeFalsy();
  });

  test('7. Cek data Grup ada/tidak, lalu Tambah & verifikasi @smoke', async ({ page }) => {
    const cg = await BaCategoryGroupPage.open(page);

    await cg.openTab('Grup');
    if (await cg.hasRow(GRP_NAME)) {
      await cg.deleteData(GRP_NAME);
      await expect(cg.hasRow(GRP_NAME)).resolves.toBeFalsy();
    }

    await cg.openAddForm('Grup');
    await cg.fillForm({ name: GRP_NAME, code: GRP_CODE, description: GRP_DESC });
    await cg.setStatus(true);
    await cg.save();

    await expect(cg.formDialog()).toHaveCount(0, { timeout: 10000 });
    await expect(cg.hasRow(GRP_CODE)).resolves.toBeTruthy();
    const row = cg.rowFor(GRP_CODE);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(GRP_NAME);
    await expect(row).toContainText('Aktif');
  });

  test('8. Cek data Grup ada, lalu Edit nama & verifikasi @smoke', async ({ page }) => {
    const cg = await BaCategoryGroupPage.open(page);

    await cg.openTab('Grup');
    expect(await cg.hasRow(GRP_CODE)).toBeTruthy();

    await cg.openEditForm(GRP_CODE);
    await cg.fillForm({ name: GRP_NAME_EDITED });
    await cg.save();

    await expect(cg.formDialog()).toHaveCount(0, { timeout: 10000 });
    await expect(cg.hasRow(GRP_CODE)).resolves.toBeTruthy();
    await expect(cg.rowFor(GRP_CODE)).toContainText(GRP_NAME_EDITED);
  });

  test('9. Cek data Grup ada, lalu Hapus dengan konfirmasi @smoke', async ({ page }) => {
    const cg = await BaCategoryGroupPage.open(page);

    await cg.openTab('Grup');
    expect(await cg.hasRow(GRP_CODE)).toBeTruthy();

    await cg.deleteData(GRP_CODE);

    await expect(cg.hasRow(GRP_CODE)).resolves.toBeFalsy();
  });

  test('10. Tambah Grup dengan kode duplikat: pesan "sudah digunakan" muncul @smoke', async ({ page }) => {
    const cg = await BaCategoryGroupPage.open(page);

    await cg.openAddForm('Grup');
    await cg.fillForm({ name: 'QA GRUP DUP', code: 'PKDTAXS', description: 'Duplikat' });
    await cg.save();

    await expect(cg.page.getByText(/sudah digunakan/).first()).toBeVisible({ timeout: 10000 });
    await cg.closeForm();
    await expect(cg.hasRow('QA GRUP DUP')).resolves.toBeFalsy();
  });
});
