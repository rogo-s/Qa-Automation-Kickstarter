import { test, expect } from '@playwright/test';
import { JSAlertsPage } from '../../shared/pages/JSAlertsPage';
import backofficeData from '../../shared/test-data/backoffice.json';

/**
 * Studi kasus: Back Office - JavaScript Alerts
 * Target: the-internet.herokuapp.com
 * Data test: shared/test-data/backoffice.json (js_alerts)
 */

const alerts = backofficeData.js_alerts;

test.describe('Back Office - JavaScript Alerts @regression', () => {
  test('Alert menampilkan teks dan bisa diterima @smoke', async ({ page }) => {
    const alertsPage = new JSAlertsPage(page);
    await alertsPage.goto();

    let message = '';
    page.once('dialog', async (dialog) => {
      message = dialog.message();
      await dialog.accept();
    });

    await alertsPage.alertButton.click();
    expect(message).toBe(alerts.alert_text);
    await expect(alertsPage.result).toHaveText(alerts.alert_accept_result);
  });

  test('Confirm yang diterima menampilkan OK @smoke', async ({ page }) => {
    const alertsPage = new JSAlertsPage(page);
    await alertsPage.goto();

    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });

    await alertsPage.confirmButton.click();
    await expect(alertsPage.result).toHaveText(alerts.confirm_accept_result);
  });

  test('Confirm yang dibatalkan menampilkan Cancel', async ({ page }) => {
    const alertsPage = new JSAlertsPage(page);
    await alertsPage.goto();

    page.once('dialog', async (dialog) => {
      await dialog.dismiss();
    });

    await alertsPage.confirmButton.click();
    await expect(alertsPage.result).toHaveText(alerts.confirm_dismiss_result);
  });

  test('Prompt bisa diisi teks dan diterima', async ({ page }) => {
    const alertsPage = new JSAlertsPage(page);
    await alertsPage.goto();

    page.once('dialog', async (dialog) => {
      await dialog.accept(alerts.prompt_input);
    });

    await alertsPage.promptButton.click();
    await expect(alertsPage.result).toHaveText(alerts.prompt_accept_result);
  });
});
