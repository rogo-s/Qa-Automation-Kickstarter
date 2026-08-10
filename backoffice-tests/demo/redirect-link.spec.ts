import { test, expect } from '@playwright/test';
import { RedirectPage } from '../../shared/pages/RedirectPage';
import backofficeData from '../../shared/test-data/backoffice.json';

/**
 * Studi kasus: Back Office - Redirect Link
 * Target: the-internet.herokuapp.com
 * Data test: shared/test-data/backoffice.json (redirect)
 */

const redirect = backofficeData.redirect;

test.describe('Back Office - Redirect Link @regression', () => {
  test('Link redirect harus mengarah ke halaman status codes @smoke', async ({ page }) => {
    const redirectPage = new RedirectPage(page);
    await redirectPage.goto();

    await redirectPage.hereLink.click();
    await expect(page).toHaveURL(new RegExp(`${redirect.target_url}$`));
  });
});
