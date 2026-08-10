import { test, expect } from '@playwright/test';
import { WindowsPage } from '../../shared/pages/WindowsPage';
import backofficeData from '../../shared/test-data/backoffice.json';

/**
 * Studi kasus: Back Office - Multiple Windows
 * Target: the-internet.herokuapp.com
 * Data test: shared/test-data/backoffice.json (windows)
 */

const windows = backofficeData.windows;

test.describe('Back Office - Multiple Windows @regression', () => {
  test('Link membuka jendela baru dengan heading yang benar @smoke', async ({ page }) => {
    const windowsPage = new WindowsPage(page);
    await windowsPage.goto();

    const newPage = await windowsPage.openNewWindow();
    await expect(newPage.locator('h3')).toHaveText(windows.new_window_heading);
  });

  test('Jendela baru memiliki URL yang benar @smoke', async ({ page }) => {
    const windowsPage = new WindowsPage(page);
    await windowsPage.goto();

    const newPage = await windowsPage.openNewWindow();
    expect(newPage.url()).toContain(windows.new_window_url);
  });
});
