import { test, expect } from '@playwright/test';
import { aggregateReport } from '../shared/pdf/aggregate';

function mockReport(overrides = {}) {
  return {
    stats: { startTime: '2026-08-02T07:00:00.000Z', duration: 120000 },
    suites: [
      {
        title: 'API Core',
        specs: [
          {
            title: 'GET /products - return list',
            file: 'api-tests/products.spec.ts',
            line: 10,
            tests: [
              { status: 'expected', projectName: 'api', results: [{ duration: 1500 }] },
              { status: 'expected', projectName: 'api', results: [{ duration: 1200 }] },
            ],
          },
          {
            title: 'GET /auth - tanpa token 401',
            file: 'api-tests/auth.spec.ts',
            line: 24,
            tests: [
              {
                status: 'unexpected',
                projectName: 'api',
                results: [{ duration: 900, error: { message: 'Expected status 401, got 200' } }],
              },
            ],
          },
        ],
      },
      {
        title: 'Back Office',
        specs: [
          {
            title: 'login - valid credential',
            file: 'backoffice-tests/login.spec.ts',
            line: 5,
            tests: [{ status: 'expected', projectName: 'backoffice', results: [{ duration: 3000 }] }],
          },
          {
            title: 'checkboxes - toggle',
            file: 'backoffice-tests/checkboxes.spec.ts',
            line: 8,
            tests: [{ status: 'skipped', projectName: 'backoffice', results: [] }],
          },
        ],
      },
    ],
    ...overrides,
  };
}

test('agregasi menghitung total, passed, failed, skipped, dan passRate', () => {
  const result = aggregateReport(mockReport(), 'test-results/report.json');

  expect(result.total).toBe(5);
  expect(result.passed).toBe(3);
  expect(result.failed).toBe(1);
  expect(result.skipped).toBe(1);
  expect(result.flaky).toBe(0);
  expect(result.passRate).toBe(75);
  expect(result.duration).toBe(120000);
});

test('agregasi memecah ringkasan per layer (project)', () => {
  const result = aggregateReport(mockReport(), 'test-results/report.json');

  expect(result.layers).toHaveLength(2);

  const api = result.layers.find((l) => l.project === 'api');
  expect(api).toMatchObject({ total: 3, passed: 2, failed: 1, skipped: 0 });

  const backoffice = result.layers.find((l) => l.project === 'backoffice');
  expect(backoffice).toMatchObject({ total: 2, passed: 1, failed: 0, skipped: 1 });
});

test('agregasi mengumpulkan daftar test gagal dengan lokasi dan error', () => {
  const result = aggregateReport(mockReport(), 'test-results/report.json');

  expect(result.failures).toHaveLength(1);
  expect(result.failures[0]).toMatchObject({
    title: 'API Core › GET /auth - tanpa token 401',
    project: 'api',
    location: 'api-tests/auth.spec.ts:24',
  });
  expect(result.failures[0].error).toContain('Expected status 401');
});

test('filter project menghasilkan ringkasan hanya untuk layer tersebut', () => {
  const result = aggregateReport(mockReport(), 'test-results/report.json', 'api');

  expect(result.total).toBe(3);
  expect(result.layers).toHaveLength(1);
  expect(result.layers[0].project).toBe('api');
});

test('report kosong menghasilkan ringkasan kosong tanpa error', () => {
  const result = aggregateReport({ stats: { startTime: '2026-08-02T07:00:00.000Z', duration: 0 } }, 'x');

  expect(result.total).toBe(0);
  expect(result.passed).toBe(0);
  expect(result.failed).toBe(0);
  expect(result.passRate).toBe(0);
  expect(result.failures).toHaveLength(0);
});
