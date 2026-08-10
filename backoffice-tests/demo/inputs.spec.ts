import { test, expect } from '@playwright/test';
import { InputsPage } from '../../shared/pages/InputsPage';
import backofficeData from '../../shared/test-data/backoffice.json';

/**
 * Studi kasus: Back Office - Inputs
 * Target: the-internet.herokuapp.com
 * Data test: shared/test-data/backoffice.json (inputs)
 */

const inputs = backofficeData.inputs;

test.describe('Back Office - Inputs @regression', () => {
  test('Input harus menerima angka @smoke', async ({ page }) => {
    const inputsPage = new InputsPage(page);
    await inputsPage.goto();

    await inputsPage.fill(inputs.number);
    expect(await inputsPage.value()).toBe(inputs.number);
  });

  test('Input harus menerima angka desimal dan negatif', async ({ page }) => {
    const inputsPage = new InputsPage(page);
    await inputsPage.goto();

    await inputsPage.fill(inputs.decimal);
    expect(await inputsPage.value()).toBe(inputs.decimal);

    await inputsPage.fill(inputs.negative);
    expect(await inputsPage.value()).toBe(inputs.negative);
  });

  test('Menekan panah atas harus menambah nilai input @smoke', async ({ page }) => {
    const inputsPage = new InputsPage(page);
    await inputsPage.goto();

    await inputsPage.press('ArrowUp');
    expect(await inputsPage.value()).toBe(inputs.arrow_up);
  });

  test('Menekan panah bawah harus mengurangi nilai input', async ({ page }) => {
    const inputsPage = new InputsPage(page);
    await inputsPage.goto();

    await inputsPage.press('ArrowDown');
    expect(await inputsPage.value()).toBe(inputs.arrow_down);
  });
});
