import { test, expect } from '@playwright/test';
import { ShadowDomPage } from '../../shared/pages/ShadowDomPage';
import backofficeData from '../../shared/test-data/backoffice.json';

/**
 * Studi kasus: Back Office - Shadow DOM
 * Target: the-internet.herokuapp.com
 * Data test: shared/test-data/backoffice.json (shadow_dom)
 */

const shadowDom = backofficeData.shadow_dom;

test.describe('Back Office - Shadow DOM @regression', () => {
  test('Shadow DOM menampilkan konten @smoke', async ({ page }) => {
    const shadowDomPage = new ShadowDomPage(page);
    await shadowDomPage.goto();

    await expect(shadowDomPage.host.first()).toContainText(shadowDom.expected_text);
  });
});
