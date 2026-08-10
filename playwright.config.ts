import { defineConfig, devices } from '@playwright/test';
import { config } from './config';

/**
 * Config ini meniru struktur environment berjenjang (local/dev/staging/prod)
 * dengan membagi test ke 3 "project" sesuai layer produk: api, backoffice, app.
 *
 * Cara pakai:
 *   npx playwright test                    -> jalankan semua
 *   npx playwright test --project=api       -> jalankan API core saja
 *   npx playwright test --project=backoffice
 *   npx playwright test --project=app
 *   npx playwright test --grep @smoke       -> jalankan yang di-tag smoke saja
 */
export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, // retry max 1x, hanya di CI (lihat kebijakan maintenance)
  // workers: 1 -> portal playground menolak login OTP jika ada 2+ login bersamaan (terbukti flaky).
  workers: 1,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/report.json' }],
    ['allure-playwright', {
      resultsDir: 'allure-results',
      environmentInfo: {
        framework: 'Playwright',
        project: 'qa-automation-kickstarter',
      },
    }],
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'setup',
      testDir: '.',
      testMatch: /auth\.setup\.ts/,
      use: {
        baseURL: config.backoffice_base_url,
      },
    },
    {
      name: 'api',
      testDir: './api-tests',
      use: {
        baseURL: config.api_base_url,
      },
    },
    {
      name: 'backoffice',
      testDir: './backoffice-tests',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: config.backoffice_base_url,
        storageState: '.auth/portal.json',
      },
    },
    {
      name: 'app',
      testDir: './app-tests',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: config.app_base_url,
      },
    },
    {
      name: 'unit',
      testDir: './tests',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
