import { test, expect } from '@playwright/test';
import { CheckboxesPage } from '../../shared/pages/CheckboxesPage';
import backofficeData from '../../shared/test-data/backoffice.json';

/**
 * Studi kasus: Back Office - Checkboxes
 * Target: the-internet.herokuapp.com
 * Data test: shared/test-data/backoffice.json (checkboxes)
 */

const checkboxes = backofficeData.checkboxes;

test.describe('Back Office - Checkboxes @regression', () => {
  test('Halaman harus menampilkan 2 checkbox @smoke', async ({ page }) => {
    const checkboxesPage = new CheckboxesPage(page);
    await checkboxesPage.goto();

    await expect(checkboxesPage.checkboxes).toHaveCount(checkboxes.total);
  });

  test('Checkbox kedua tercentang dan checkbox pertama tidak @smoke', async ({ page }) => {
    const checkboxesPage = new CheckboxesPage(page);
    await checkboxesPage.goto();

    expect(await checkboxesPage.isChecked(checkboxes.default_checked_index)).toBe(true);
    expect(await checkboxesPage.isChecked(checkboxes.default_unchecked_index)).toBe(false);
  });

  test('Checkbox bisa dicentang dan dihapus centang', async ({ page }) => {
    const checkboxesPage = new CheckboxesPage(page);
    await checkboxesPage.goto();

    await checkboxesPage.check(checkboxes.default_unchecked_index);
    expect(await checkboxesPage.isChecked(checkboxes.default_unchecked_index)).toBe(true);

    await checkboxesPage.uncheck(checkboxes.default_checked_index);
    expect(await checkboxesPage.isChecked(checkboxes.default_checked_index)).toBe(false);
  });
});
