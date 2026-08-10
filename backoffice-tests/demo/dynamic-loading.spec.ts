import { test, expect } from '@playwright/test';
import { DynamicLoadingPage } from '../../shared/pages/DynamicLoadingPage';
import backofficeData from '../../shared/test-data/backoffice.json';

/**
 * Studi kasus: Back Office - Dynamic Loading
 * Target: the-internet.herokuapp.com
 * Data test: shared/test-data/backoffice.json (dynamic_loading)
 */

const loading = backofficeData.dynamic_loading;

test.describe('Back Office - Dynamic Loading @regression', () => {
  test('Elemen muncul setelah loading (example 1) @smoke', async ({ page }) => {
    const loadingPage = new DynamicLoadingPage(page);
    await loadingPage.goto(1);

    await expect(loadingPage.startButton).toBeVisible();
    await loadingPage.start();
    await expect(loadingPage.finishText).toHaveText(loading.finish_text, { timeout: 15000 });
  });

  test('Elemen muncul setelah loading (example 2)', async ({ page }) => {
    const loadingPage = new DynamicLoadingPage(page);
    await loadingPage.goto(2);

    await loadingPage.start();
    await expect(loadingPage.finishText).toHaveText(loading.finish_text, { timeout: 15000 });
  });

  test('Finish tersembunyi sebelum start dan loading muncul setelah start @smoke', async ({
    page,
  }) => {
    const loadingPage = new DynamicLoadingPage(page);
    await loadingPage.goto(1);

    await expect(loadingPage.finishText).toBeHidden();

    await loadingPage.start();
    await expect(loadingPage.loadingText).toBeVisible();
    await expect(loadingPage.finishText).toHaveText(loading.finish_text, { timeout: 15000 });
  });
});
