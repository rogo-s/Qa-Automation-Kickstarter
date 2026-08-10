import { test, expect } from '@playwright/test';
import { BrokenImagesPage } from '../../shared/pages/BrokenImagesPage';
import backofficeData from '../../shared/test-data/backoffice.json';

/**
 * Studi kasus: Back Office - Broken Images
 * Target: the-internet.herokuapp.com
 * Data test: shared/test-data/backoffice.json (broken_images)
 */

const brokenImages = backofficeData.broken_images;

test.describe('Back Office - Broken Images @regression', () => {
  test('Halaman memuat 3 gambar dengan 2 rusak dan 1 valid @smoke', async ({ page }) => {
    const brokenImagesPage = new BrokenImagesPage(page);
    await brokenImagesPage.goto();

    const widths = await brokenImagesPage.imageNaturalWidths();
    expect(widths.length).toBe(brokenImages.image_count);
    expect(widths.filter((w) => w === 0)).toHaveLength(brokenImages.broken_count);
    expect(widths.filter((w) => w > 0)).toHaveLength(brokenImages.valid_count);
  });
});
