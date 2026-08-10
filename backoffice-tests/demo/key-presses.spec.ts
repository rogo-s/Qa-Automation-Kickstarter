import { test, expect } from '@playwright/test';
import { KeyPressesPage } from '../../shared/pages/KeyPressesPage';
import backofficeData from '../../shared/test-data/backoffice.json';

/**
 * Studi kasus: Back Office - Key Presses
 * Target: the-internet.herokuapp.com
 * Data test: shared/test-data/backoffice.json (key_presses)
 */

const keyPresses = backofficeData.key_presses;

test.describe('Back Office - Key Presses @regression', () => {
  test('Menekan Escape harus menampilkan nama tombol @smoke', async ({ page }) => {
    const keyPressesPage = new KeyPressesPage(page);
    await keyPressesPage.goto();

    await keyPressesPage.pressKey('Escape');
    await expect(keyPressesPage.result).toHaveText(keyPresses.escape_result);
  });

  test('Menekan Shift harus menampilkan nama tombol', async ({ page }) => {
    const keyPressesPage = new KeyPressesPage(page);
    await keyPressesPage.goto();

    await keyPressesPage.pressKey('Shift');
    await expect(keyPressesPage.result).toHaveText(keyPresses.shift_result);
  });
});
