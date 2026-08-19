import { test, expect } from '@playwright/test';
import { BaBillingProviderPage } from '../../../shared/pages/BaBillingProviderPage';

/**
 * Master Data Billing Provider - BOT BA (Biller Aggregator).
 * Pola CRUD sama dengan PPOB NONA: SEARCH/cek data dulu, baru eksekusi.
 *
 * 1. Validasi form: Simpan disabled sampai nama + kode + route terisi
 * 2. Cek data ada/tidak -> bersihkan -> Tambah provider -> verifikasi
 * 3. Cek data ada -> Edit nama -> verifikasi
 * 4. Cek data ada -> Nonaktifkan lalu aktifkan lagi -> verifikasi status
 * 5. Cek data ada -> Hapus (konfirmasi) -> verifikasi hilang
 * 6. Tambah dengan kode duplikat -> pesan "sudah digunakan"
 */
test.describe.configure({ mode: 'serial', timeout: 300000 });

const PROVIDER_NAME = 'QA PROVIDER TES';
const PROVIDER_NAME_EDITED = PROVIDER_NAME + ' EDIT';
const PROVIDER_CODE = 'QAPROV';
const PROVIDER_ROUTE = 'svc-ba-biller-integrator-qaprov:3001';

test.describe('BOT BA - Menu Billing Provider @regression', () => {
  test('1. Validasi form tambah: Simpan disabled sampai field wajib terisi @smoke', async ({ page }) => {
    const prov = await BaBillingProviderPage.open(page);
    await prov.openAddForm();

    await expect(prov.isSaveDisabled()).resolves.toBeTruthy();

    await prov.fillForm({ name: PROVIDER_NAME });
    await expect(prov.isSaveDisabled()).resolves.toBeTruthy();

    await prov.fillForm({ code: PROVIDER_CODE });
    await expect(prov.isSaveDisabled()).resolves.toBeTruthy();

    await prov.fillForm({ route: PROVIDER_ROUTE });
    await expect(prov.isSaveDisabled()).resolves.toBeFalsy();

    await prov.closeForm();
  });

  test('2. Cek data ada/tidak, lalu Tambah provider & verifikasi @smoke', async ({ page }) => {
    const prov = await BaBillingProviderPage.open(page);

    if (await prov.hasRow(PROVIDER_CODE)) {
      await prov.deleteData(PROVIDER_CODE);
      await expect(prov.hasRow(PROVIDER_CODE)).resolves.toBeFalsy();
    }

    await prov.openAddForm();
    await prov.fillForm({ name: PROVIDER_NAME, code: PROVIDER_CODE, route: PROVIDER_ROUTE });
    await prov.setStatus(true);
    await prov.save();

    await expect(prov.formDialog()).toHaveCount(0, { timeout: 10000 });
    await expect(prov.hasRow(PROVIDER_CODE)).resolves.toBeTruthy();
    const row = prov.rowFor(PROVIDER_CODE);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(PROVIDER_NAME);
    await expect(row).toContainText(PROVIDER_ROUTE);
    await expect(row).toContainText('Aktif');
  });

  test('3. Cek data ada, lalu Edit nama & verifikasi @smoke', async ({ page }) => {
    const prov = await BaBillingProviderPage.open(page);

    expect(await prov.hasRow(PROVIDER_CODE)).toBeTruthy();

    await prov.openEditForm(PROVIDER_CODE);
    await prov.fillForm({ name: PROVIDER_NAME_EDITED });
    await prov.save();

    await expect(prov.formDialog()).toHaveCount(0, { timeout: 10000 });
    await expect(prov.hasRow(PROVIDER_CODE)).resolves.toBeTruthy();
    await expect(prov.rowFor(PROVIDER_CODE)).toContainText(PROVIDER_NAME_EDITED);
  });

  test('4. Cek data ada, lalu nonaktifkan & aktifkan lagi @smoke', async ({ page }) => {
    const prov = await BaBillingProviderPage.open(page);

    expect(await prov.hasRow(PROVIDER_CODE)).toBeTruthy();

    await prov.openEditForm(PROVIDER_CODE);
    await prov.setStatus(false);
    await prov.save();
    await expect(prov.hasRow(PROVIDER_CODE)).resolves.toBeTruthy();
    await expect(prov.rowFor(PROVIDER_CODE)).toContainText('Tidak Aktif');

    await prov.openEditForm(PROVIDER_CODE);
    await prov.setStatus(true);
    await prov.save();
    await expect(prov.hasRow(PROVIDER_CODE)).resolves.toBeTruthy();
    await expect(prov.rowFor(PROVIDER_CODE)).toContainText('Aktif');
  });

  test('5. Cek data ada, lalu Hapus dengan konfirmasi @smoke', async ({ page }) => {
    const prov = await BaBillingProviderPage.open(page);

    expect(await prov.hasRow(PROVIDER_CODE)).toBeTruthy();

    await prov.deleteData(PROVIDER_CODE);

    await expect(prov.hasRow(PROVIDER_CODE)).resolves.toBeFalsy();
  });

  test('6. Tambah dengan kode duplikat: pesan "sudah digunakan" muncul @smoke', async ({ page }) => {
    const prov = await BaBillingProviderPage.open(page);

    await prov.openAddForm();
    await prov.fillForm({ name: 'QA DUP PROV', code: 'ayoconnect', route: 'svc-ba-biller-integrator-dup:3001' });
    await prov.save();

    await expect(prov.page.getByText(/sudah digunakan/).first()).toBeVisible({ timeout: 10000 });
    await prov.closeForm();
    await expect(prov.hasRow('QA DUP PROV')).resolves.toBeFalsy();
  });
});
