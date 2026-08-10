import { test, expect } from '@playwright/test';
import { StatusCodesPage } from '../../shared/pages/StatusCodesPage';
import backofficeData from '../../shared/test-data/backoffice.json';

/**
 * Studi kasus: Back Office - Status Codes
 * Target: the-internet.herokuapp.com
 * Data test: shared/test-data/backoffice.json (status_codes)
 */

const statusCodes = backofficeData.status_codes;

test.describe('Back Office - Status Codes @regression', () => {
  test('Halaman menampilkan link untuk setiap status code @smoke', async ({ page }) => {
    const statusCodesPage = new StatusCodesPage(page);
    await statusCodesPage.goto();

    for (const code of statusCodes.codes) {
      await expect(statusCodesPage.statusLink(code)).toBeVisible();
    }
  });

  for (const code of statusCodes.codes) {
    test(`Status code ${code} harus menampilkan halaman yang benar @smoke`, async ({ page }) => {
      const statusCodesPage = new StatusCodesPage(page);
      await statusCodesPage.open(code);

      await expect(statusCodesPage.content).toContainText(
        `This page returned a ${code} status code`,
      );
    });
  }
});
