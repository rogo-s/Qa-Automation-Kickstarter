import { test, expect } from '@playwright/test';
import { HorizontalSliderPage } from '../../shared/pages/HorizontalSliderPage';
import backofficeData from '../../shared/test-data/backoffice.json';

/**
 * Studi kasus: Back Office - Horizontal Slider
 * Target: the-internet.herokuapp.com
 * Data test: shared/test-data/backoffice.json (horizontal_slider)
 */

const slider = backofficeData.horizontal_slider;

test.describe('Back Office - Horizontal Slider @regression', () => {
  test('Slider memiliki rentang 0 sampai 5 @smoke', async ({ page }) => {
    const sliderPage = new HorizontalSliderPage(page);
    await sliderPage.goto();

    await expect(sliderPage.slider).toHaveAttribute('min', slider.min);
    await expect(sliderPage.slider).toHaveAttribute('max', slider.max);
  });

  test('Nilai slider dan teks rentang harus sinkron @smoke', async ({ page }) => {
    const sliderPage = new HorizontalSliderPage(page);
    await sliderPage.goto();

    const initial = await sliderPage.slider.inputValue();
    await expect(sliderPage.range).toHaveText(initial);
  });

  test('Menggeser slider harus memperbarui nilai', async ({ page }) => {
    const sliderPage = new HorizontalSliderPage(page);
    await sliderPage.goto();

    const initial = await sliderPage.slider.inputValue();
    await sliderPage.slider.click();
    await sliderPage.slider.press('ArrowRight');
    await sliderPage.slider.press('ArrowRight');

    const updated = await sliderPage.slider.inputValue();
    expect(updated).not.toBe(initial);
    await expect(sliderPage.range).toHaveText(updated);
  });
});
