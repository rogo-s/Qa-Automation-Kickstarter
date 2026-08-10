import { test, expect } from '@playwright/test';
import { HoverPage } from '../../shared/pages/HoverPage';
import backofficeData from '../../shared/test-data/backoffice.json';

/**
 * Studi kasus: Back Office - Hovers
 * Target: the-internet.herokuapp.com
 * Data test: shared/test-data/backoffice.json (hover)
 */

const hover = backofficeData.hover;

test.describe('Back Office - Hover @regression', () => {
  test('Halaman harus menampilkan 3 gambar @smoke', async ({ page }) => {
    const hoverPage = new HoverPage(page);
    await hoverPage.goto();

    await expect(hoverPage.figures).toHaveCount(hover.figure_count);
  });

  test('Hover pada gambar harus menampilkan nama user @smoke', async ({ page }) => {
    const hoverPage = new HoverPage(page);
    await hoverPage.goto();

    await hoverPage.hoverFigure(0);
    await expect(hoverPage.captionLocator(0)).toBeVisible();
    expect(await hoverPage.captionText(0)).toContain(`${hover.user_prefix}1`);
  });

  test('Hover pada setiap gambar harus menampilkan nama yang sesuai', async ({ page }) => {
    const hoverPage = new HoverPage(page);
    await hoverPage.goto();

    for (let i = 0; i < hover.figure_count; i++) {
      await hoverPage.hoverFigure(i);
      expect(await hoverPage.captionText(i)).toContain(`${hover.user_prefix}${i + 1}`);
    }
  });
});
