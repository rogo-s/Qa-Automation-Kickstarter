import { test, expect } from '@playwright/test';
import { DynamicControlsPage } from '../../shared/pages/DynamicControlsPage';
import backofficeData from '../../shared/test-data/backoffice.json';

/**
 * Studi kasus: Back Office - Dynamic Controls
 * Target: the-internet.herokuapp.com
 * Data test: shared/test-data/backoffice.json (dynamic_controls)
 */

const controls = backofficeData.dynamic_controls;

test.describe('Back Office - Dynamic Controls @regression', () => {
  test('Checkbox terlihat dan bisa dihapus @smoke', async ({ page }) => {
    const controlsPage = new DynamicControlsPage(page);
    await controlsPage.goto();

    await expect(controlsPage.checkbox).toBeVisible();
    await controlsPage.removeCheckbox();
    await expect(controlsPage.message).toHaveText(controls.gone_message);
    await expect(controlsPage.checkbox).toHaveCount(0);
  });

  test('Checkbox yang dihapus bisa ditambahkan kembali', async ({ page }) => {
    const controlsPage = new DynamicControlsPage(page);
    await controlsPage.goto();

    await controlsPage.removeCheckbox();
    await expect(controlsPage.message).toHaveText(controls.gone_message);

    await controlsPage.addCheckbox();
    await expect(controlsPage.message).toHaveText(controls.back_message);
    await expect(controlsPage.checkbox).toBeVisible();
  });

  test('Input bisa di-enable dan di-disable @smoke', async ({ page }) => {
    const controlsPage = new DynamicControlsPage(page);
    await controlsPage.goto();

    await expect(controlsPage.input).toBeDisabled();

    await controlsPage.enableInput();
    await expect(controlsPage.message).toHaveText(controls.enabled_message);
    await expect(controlsPage.input).toBeEnabled();

    await controlsPage.disableInput();
    await expect(controlsPage.message).toHaveText(controls.disabled_message);
    await expect(controlsPage.input).toBeDisabled();
  });
});
