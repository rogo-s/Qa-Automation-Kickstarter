import { test, expect } from '@playwright/test';
import { DropdownPage } from '../../shared/pages/DropdownPage';
import backofficeData from '../../shared/test-data/backoffice.json';

/**
 * Studi kasus: Back Office - Dropdown List
 * Target: the-internet.herokuapp.com
 * Data test: shared/test-data/backoffice.json (dropdown)
 */

const dropdown = backofficeData.dropdown;

test.describe('Back Office - Dropdown @regression', () => {
  test('Halaman harus menampilkan select dropdown @smoke', async ({ page }) => {
    const dropdownPage = new DropdownPage(page);
    await dropdownPage.goto();

    await expect(dropdownPage.select).toBeVisible();
    expect(await dropdownPage.selectedValue()).toBe(dropdown.default_value);
  });

  test('Memilih Option 1 harus mengubah nilai dropdown @smoke', async ({ page }) => {
    const dropdownPage = new DropdownPage(page);
    await dropdownPage.goto();

    await dropdownPage.selectByLabel(dropdown.option1_label);
    expect(await dropdownPage.selectedValue()).toBe(dropdown.option1_value);
  });

  test('Memilih Option 2 harus mengubah nilai dropdown', async ({ page }) => {
    const dropdownPage = new DropdownPage(page);
    await dropdownPage.goto();

    await dropdownPage.selectByLabel(dropdown.option2_label);
    expect(await dropdownPage.selectedValue()).toBe(dropdown.option2_value);
  });

  test('Pilihan dropdown bisa dipindah antar opsi', async ({ page }) => {
    const dropdownPage = new DropdownPage(page);
    await dropdownPage.goto();

    await dropdownPage.selectByLabel(dropdown.option1_label);
    expect(await dropdownPage.selectedValue()).toBe(dropdown.option1_value);

    await dropdownPage.selectByLabel(dropdown.option2_label);
    expect(await dropdownPage.selectedValue()).toBe(dropdown.option2_value);
  });
});
