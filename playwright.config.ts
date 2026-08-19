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
  testDir: './setup',
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
      testDir: './setup',
      testMatch: /auth\.setup\.ts/,
      use: {
        baseURL: config.backoffice_base_url,
        headless: false,
      },
    },
    {
      name: 'setup-webview-nona',
      testDir: './setup',
      testMatch: /auth\.webview-nona\.setup\.ts/,
      use: {
        baseURL: config.ppob_nona_webview_base_url,
        headless: false,
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
      testIgnore: [/demo\//, /webview-nona\//],
      dependencies: ['setup'],
      timeout: 120000,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: config.backoffice_base_url,
        storageState: '.auth/portal.json',
        headless: false,
        launchOptions: { slowMo: 1000 },
        actionTimeout: 30000,
      },
    },
    {
      name: 'webview-nona',
      testDir: './backoffice-tests/bots/ppob-nona/webview-nona',
      dependencies: ['setup-webview-nona'],
      timeout: 120000,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: config.ppob_nona_webview_base_url,
        storageState: '.auth/webview-nona.json',
        headless: false,
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
