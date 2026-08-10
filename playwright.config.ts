import { defineConfig, devices } from '@playwright/test';
import { config } from './config';

/**
 * Config meniru struktur environment berjenjang (local/dev/staging/prod)
 * dengan membagi test ke 4 "project" sesuai layer otomasi: api, backoffice, app, unit.
 *
 * Cara pakai (pilih layer):
 *   npx playwright test                       -> jalankan semua layer
 *   npx playwright test --project=api         -> API core saja
 *   npx playwright test --project=backoffice  -> Back Office (portal BOT) saja
 *   npx playwright test --project=app         -> End-user App saja
 *   npx playwright test --project=unit        -> Unit test saja
 *   npx playwright test --grep @smoke         -> yang di-tag @smoke saja
 *
 * Test demo (the-internet) disimpan di backoffice-tests/demo dan sengaja
 * di-ignore supaya tidak ikut run project backoffice.
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
      testIgnore: /demo\//,
      dependencies: ['setup'],
      timeout: 120000,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: config.backoffice_base_url,
        storageState: '.auth/portal.json',
        launchOptions: { slowMo: 1000 },
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
      testDir: './unit-tests',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
