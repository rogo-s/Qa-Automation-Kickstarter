import { test, expect } from '@playwright/test';
import { DashboardPage } from '../../shared/pages/DashboardPage';
import backofficeData from '../../shared/test-data/backoffice.json';

/**
 * Studi kasus: Back Office - Dashboard (halaman utama)
 * Target: the-internet.herokuapp.com
 * Data test: shared/test-data/backoffice.json (dashboard)
 */

const dashboard = backofficeData.dashboard;

test.describe('Back Office - Dashboard @regression', () => {
  test('Dashboard harus menampilkan judul yang benar @smoke', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();

    await expect(dashboardPage.heading).toHaveText(dashboard.heading);
  });

  test('Dashboard harus menampilkan subheading Available Examples @smoke', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();

    await expect(dashboardPage.subheading).toContainText(dashboard.subheading);
  });

  test('Dashboard harus memuat modul-modul utama', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();

    const names = await dashboardPage.getLinkNames();
    expect(names).toContain(dashboard.page_links.login);
    expect(names).toContain(dashboard.page_links.tables);
    expect(names).toContain(dashboard.page_links.upload);
    expect(names).toContain(dashboard.page_links.checkboxes);
    expect(names).toContain(dashboard.module_links.dynamic_controls);
    expect(names).toContain(dashboard.module_links.javascript_alerts);
  });

  test('Setiap link modul harus memiliki tujuan yang valid', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();

    const linkCount = await dashboardPage.exampleLinks.count();
    expect(linkCount).toBeGreaterThan(0);
    const hrefs = await dashboardPage.getLinkHrefs();
    for (const href of hrefs) {
      expect(href).toBeTruthy();
    }
  });

  test('Klik modul Checkboxes harus menuju halaman /checkboxes @smoke', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();

    await dashboardPage.openModule(dashboard.page_links.checkboxes);
    await expect(page).toHaveURL(/\/checkboxes$/);
  });
});
