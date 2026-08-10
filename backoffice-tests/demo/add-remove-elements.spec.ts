import { test, expect } from '@playwright/test';
import { AddRemoveElementsPage } from '../../shared/pages/AddRemoveElementsPage';
import backofficeData from '../../shared/test-data/backoffice.json';

/**
 * Studi kasus: Back Office - Add/Remove Elements
 * Target: the-internet.herokuapp.com
 * Data test: shared/test-data/backoffice.json (add_remove)
 */

const addRemove = backofficeData.add_remove;

test.describe('Back Office - Add/Remove Elements @regression', () => {
  test('Halaman mulai dengan daftar kosong @smoke', async ({ page }) => {
    const pageObject = new AddRemoveElementsPage(page);
    await pageObject.goto();

    expect(await pageObject.count()).toBe(0);
  });

  test('Menambahkan elemen harus menambah tombol Delete @smoke', async ({ page }) => {
    const pageObject = new AddRemoveElementsPage(page);
    await pageObject.goto();

    await pageObject.addElement(addRemove.add_count);
    expect(await pageObject.count()).toBe(addRemove.add_count);
  });

  test('Menghapus elemen harus mengurangi jumlah tombol Delete', async ({ page }) => {
    const pageObject = new AddRemoveElementsPage(page);
    await pageObject.goto();

    await pageObject.addElement(addRemove.add_count);
    await pageObject.removeElement(0);
    expect(await pageObject.count()).toBe(2);

    await pageObject.removeElement(1);
    expect(await pageObject.count()).toBe(1);
  });

  test('Menghapus semua elemen harus mengosongkan daftar', async ({ page }) => {
    const pageObject = new AddRemoveElementsPage(page);
    await pageObject.goto();

    await pageObject.addElement(2);
    await pageObject.removeElement(0);
    await pageObject.removeElement(0);
    expect(await pageObject.count()).toBe(0);
  });
});
