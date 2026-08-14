/**
 * Pure function untuk mengubah output JSON reporter Playwright
 * menjadi struktur ringkasan yang siap dirender ke PDF.
 *
 * Unit ini tidak bergantung pada browser / playwright runtime,
 * sehingga mudah di-test tanpa menjalankan test sama sekali.
 */

export type LayerSummary = {
  project: string;
  total: number;
  passed: number;
  failed: number;
  flaky: number;
  skipped: number;
  duration: number;
};

export type FailureEntry = {
  title: string;
  project: string;
  location: string;
  error: string;
};

export type TestCaseEntry = {
  title: string;
  project: string;
  location: string;
  status: 'passed' | 'failed' | 'flaky' | 'skipped';
  duration: number;
};

export type AggregateReport = {
  startTime: string;
  duration: number;
  total: number;
  passed: number;
  failed: number;
  flaky: number;
  skipped: number;
  passRate: number;
  layers: LayerSummary[];
  failures: FailureEntry[];
  cases: TestCaseEntry[];
  source: string;
};

type JsonTest = {
  status?: 'skipped' | 'expected' | 'unexpected' | 'flaky';
  projectName?: string;
  results?: {
    duration?: number;
    error?: { message?: string };
  }[];
};

type JsonSpec = {
  title?: string;
  file?: string;
  line?: number;
  tests?: JsonTest[];
};

type JsonSuite = {
  title?: string;
  specs?: JsonSpec[];
  suites?: JsonSuite[];
};

type JsonReport = {
  stats?: {
    startTime?: string;
    duration?: number;
  };
  suites?: JsonSuite[];
};

const OK_STATUSES = new Set(['expected', 'flaky']);

function collectSpecs(suites: JsonSuite[] | undefined, path: string[]): { title: string; file: string; line: number; test: JsonTest }[] {
  const acc: { title: string; file: string; line: number; test: JsonTest }[] = [];
  const walk = (suites: JsonSuite[] | undefined, inherited: string[]) => {
    for (const suite of suites ?? []) {
      const suiteTitle = [...inherited, suite.title ?? ''];
      for (const spec of suite.specs ?? []) {
        const title = [...suiteTitle, spec.title ?? ''].filter(Boolean).join(' › ');
        for (const test of spec.tests ?? []) {
          acc.push({ title, file: spec.file ?? '', line: spec.line ?? 0, test });
        }
      }
      walk(suite.suites, suiteTitle);
    }
  };
  walk(suites, path);
  return acc;
}

export function aggregateReport(raw: unknown, source: string, projectFilter?: string): AggregateReport {
  const report = (raw ?? {}) as JsonReport;
  const specs = collectSpecs(report.suites, []);

  const filtered = projectFilter ? specs.filter((s) => s.test.projectName === projectFilter) : specs;

  const layers = new Map<string, LayerSummary>();
  const failures: FailureEntry[] = [];
  const cases: TestCaseEntry[] = [];

  for (const spec of filtered) {
    const project = spec.test.projectName ?? 'unknown';
    const layer = layers.get(project) ?? { project, total: 0, passed: 0, failed: 0, flaky: 0, skipped: 0, duration: 0 };
    layer.total += 1;
    const duration = spec.test.results?.reduce((sum, r) => sum + (r.duration ?? 0), 0) ?? 0;
    layer.duration += duration;

    let status: TestCaseEntry['status'] = 'failed';
    switch (spec.test.status) {
      case 'expected':
        layer.passed += 1;
        status = 'passed';
        break;
      case 'flaky':
        layer.flaky += 1;
        status = 'flaky';
        break;
      case 'skipped':
        layer.skipped += 1;
        status = 'skipped';
        break;
      case 'unexpected':
      default:
        layer.failed += 1;
        const last = spec.test.results?.findLast((r) => r.error);
        failures.push({
          title: spec.title,
          project,
          location: `${spec.file}:${spec.line}`,
          error: last?.error?.message ?? '(tanpa detail error)',
        });
        break;
    }

    cases.push({
      title: spec.title,
      project,
      location: `${spec.file}:${spec.line}`,
      status,
      duration,
    });

    layers.set(project, layer);
  }

  const total = filtered.length;
  const passed = [...layers.values()].reduce((sum, l) => sum + l.passed, 0);
  const failed = [...layers.values()].reduce((sum, l) => sum + l.failed, 0);
  const flaky = [...layers.values()].reduce((sum, l) => sum + l.flaky, 0);
  const skipped = [...layers.values()].reduce((sum, l) => sum + l.skipped, 0);
  const executed = total - skipped;

  return {
    startTime: report.stats?.startTime ?? new Date().toISOString(),
    duration: report.stats?.duration ?? 0,
    total,
    passed,
    failed,
    flaky,
    skipped,
    passRate: executed === 0 ? 0 : Math.round((passed / executed) * 1000) / 10,
    layers: [...layers.values()].sort((a, b) => a.project.localeCompare(b.project)),
    failures,
    cases,
    source,
  };
}
