import { test, expect, Locator } from '@playwright/test';
import { DataTablePage } from '../../shared/pages/DataTablePage';
import backofficeData from '../../shared/test-data/backoffice.json';

/**
 * Studi kasus: Back Office - Sortable Data Tables
 * Target: the-internet.herokuapp.com
 * Data test: shared/test-data/backoffice.json (table)
 */

const table = backofficeData.table;

async function expectColumnSortedAsc(tablePage: DataTablePage, target: Locator, columnIndex: number) {
  await expect
    .poll(async () => {
      const values = await tablePage.getColumnValues(target, columnIndex);
      const isMoney = values.some((v) => v.startsWith('$'));
      if (isMoney) {
        const nums = values.map((v) => parseFloat(v.replace('$', '').replace(',', '')));
        return nums.every((n, i) => i === 0 || nums[i - 1] <= n);
      }
      const sorted = [...values].sort((a, b) => a.localeCompare(b));
      return JSON.stringify(values) === JSON.stringify(sorted);
    })
    .toBe(true);
}

test.describe('Back Office - Data Table @regression', () => {
  test('Tabel 1 harus menampilkan jumlah baris yang benar @smoke', async ({ page }) => {
    const tablePage = new DataTablePage(page);
    await tablePage.goto();

    await expect(tablePage.table1).toBeVisible();
    const rows = await tablePage.getRows(tablePage.table1);
    expect(rows.length).toBe(table.row_count);
  });

  test('Tabel 1 harus menampilkan data nama belakang yang benar', async ({ page }) => {
    const tablePage = new DataTablePage(page);
    await tablePage.goto();

    const lastNames = await tablePage.getColumnValues(tablePage.table1, table.columns.last_name);
    expect(lastNames).toEqual(expect.arrayContaining(table.last_names));
  });

  test('Tabel 1 harus menampilkan kolom email dengan format valid', async ({ page }) => {
    const tablePage = new DataTablePage(page);
    await tablePage.goto();

    const emails = await tablePage.getColumnValues(tablePage.table1, table.columns.email);
    for (const email of emails) {
      expect(email).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
    }
  });

  test('Sort by Last Name harus mengurutkan nama naik @smoke', async ({ page }) => {
    const tablePage = new DataTablePage(page);
    await tablePage.goto();

    await tablePage.sortBy(tablePage.table1, 'Last Name');
    await expectColumnSortedAsc(tablePage, tablePage.table1, table.columns.last_name);
  });

  test('Sort by First Name harus mengurutkan nama naik', async ({ page }) => {
    const tablePage = new DataTablePage(page);
    await tablePage.goto();

    await tablePage.sortBy(tablePage.table1, 'First Name');
    await expectColumnSortedAsc(tablePage, tablePage.table1, table.columns.first_name);
  });

  test('Sort by Due harus mengurutkan nilai uang naik @smoke', async ({ page }) => {
    const tablePage = new DataTablePage(page);
    await tablePage.goto();

    await tablePage.sortBy(tablePage.table1, 'Due');
    await expectColumnSortedAsc(tablePage, tablePage.table1, table.columns.due);
  });

  test('Tabel 2 harus menampilkan data email dengan class selector', async ({ page }) => {
    const tablePage = new DataTablePage(page);
    await tablePage.goto();

    const emails = await tablePage.table2
      .locator('tbody td.email')
      .evaluateAll((cells) => cells.map((cell) => cell.textContent?.trim() ?? ''));
    expect(emails).toEqual(expect.arrayContaining(table.emails));
  });
});
