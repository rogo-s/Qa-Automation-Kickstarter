import type { AggregateReport, LayerSummary, FailureEntry, TestCaseEntry } from './aggregate';
import { FINDINGS, type Finding } from './findings';

function formatDate(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'Asia/Jakarta',
  }).format(d);
}

function formatDuration(ms: number): string {
  if (!ms || ms < 0) return '0 detik';
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds} detik`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes} menit ${rest} detik`;
}

function cardClass(layer: LayerSummary): string {
  if (layer.failed > 0) return 'card-danger';
  if (layer.flaky > 0) return 'card-warning';
  return 'card-ok';
}

function layerTable(layers: LayerSummary[]): string {
  const rows = layers
    .map(
      (l) => `
      <tr>
        <td>${l.project}</td>
        <td>${l.total}</td>
        <td>${l.passed}</td>
        <td>${l.failed}</td>
        <td>${l.flaky}</td>
        <td>${l.skipped}</td>
        <td>${formatDuration(l.duration)}</td>
      </tr>`,
    )
    .join('');

  return `
    <table>
      <thead>
        <tr>
          <th>Layer</th>
          <th>Total</th>
          <th>Passed</th>
          <th>Failed</th>
          <th>Flaky</th>
          <th>Skipped</th>
          <th>Durasi</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function failureRows(failures: FailureEntry[]): string {
  if (failures.length === 0) {
    return `<p class="muted">Tidak ada test yang gagal.</p>`;
  }

  return failures
    .map(
      (f) => `
      <div class="failure">
        <p class="failure-title">${f.title}</p>
        <p class="muted">${f.project} — ${f.location}</p>
        <pre class="failure-error">${escapeHtml(f.error)}</pre>
      </div>`,
    )
    .join('');
}

function findingBadge(category: Finding['category']): string {
  switch (category) {
    case 'BUG':
      return '<span class="badge badge-fail">BUG</span>';
    case 'CHANGE':
      return '<span class="badge badge-flaky">CHANGE</span>';
    case 'DATA':
      return '<span class="badge badge-skip">DATA</span>';
    case 'INFRA':
      return '<span class="badge badge-skip">INFRA</span>';
    case 'NOTE':
      return '<span class="badge badge-pass">NOTE</span>';
  }
}

function findingStatus(status: Finding['status']): string {
  switch (status) {
    case 'OPEN':
      return '<span class="badge badge-fail">OPEN</span>';
    case 'MONITORED':
      return '<span class="badge badge-flaky">MONITORED</span>';
    case 'RESOLVED':
      return '<span class="badge badge-pass">RESOLVED</span>';
    case 'INFO':
      return '<span class="badge badge-skip">INFO</span>';
  }
}

function findingRows(): string {
  return FINDINGS.map(
    (f) => `
    <tr>
      <td class="case-meta">${f.id}</td>
      <td>${findingBadge(f.category)} ${findingStatus(f.status)}</td>
      <td class="case-title">${escapeHtml(f.title)}</td>
      <td>${escapeHtml(f.detail)}</td>
    </tr>`,
  )
    .join('');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function statusBadge(status: TestCaseEntry['status']): string {
  switch (status) {
    case 'passed':
      return '<span class="badge badge-pass">PASS</span>';
    case 'failed':
      return '<span class="badge badge-fail">FAIL</span>';
    case 'flaky':
      return '<span class="badge badge-flaky">FLAKY</span>';
    case 'skipped':
      return '<span class="badge badge-skip">SKIP</span>';
  }
}

function caseRows(cases: TestCaseEntry[]): string {
  return cases
    .map(
      (c) => `
      <tr>
        <td class="case-status">${statusBadge(c.status)}</td>
        <td class="case-title">${escapeHtml(c.title)}</td>
        <td class="case-meta">${escapeHtml(c.project)}</td>
        <td class="case-meta">${escapeHtml(c.location)}</td>
        <td class="case-meta">${formatDuration(c.duration)}</td>
      </tr>`,
    )
    .join('');
}

export function renderReport(aggregate: AggregateReport): string {
  const { total, passed, failed, flaky, skipped, passRate } = aggregate;

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Laporan Hasil Pengujian</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    color: #1f2933;
    margin: 0;
    padding: 32px;
    font-size: 12px;
    line-height: 1.5;
  }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 15px; margin: 28px 0 10px; border-bottom: 2px solid #e4e7eb; padding-bottom: 6px; }
  .muted { color: #7b8794; font-size: 11px; margin: 2px 0; }
  .summary { display: flex; gap: 12px; margin-top: 20px; }
  .card {
    flex: 1;
    border: 1px solid #e4e7eb;
    border-radius: 8px;
    padding: 12px 16px;
    text-align: center;
  }
  .card .num { font-size: 26px; font-weight: bold; }
  .card .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #7b8794; }
  .card-ok .num { color: #14804a; }
  .card-danger .num { color: #c81e1e; }
  .card-warning .num { color: #b7791f; }
  .card-neutral .num { color: #3e4c59; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th, td { border: 1px solid #e4e7eb; padding: 6px 10px; text-align: left; }
  th { background: #f5f7fa; font-size: 10px; text-transform: uppercase; letter-spacing: 0.4px; color: #3e4c59; }
  .failure { border: 1px solid #f3d4d4; background: #fdf5f5; border-radius: 6px; padding: 8px 12px; margin-bottom: 8px; }
  .failure-title { font-weight: bold; margin: 0; color: #a61b1b; }
  .failure-error { white-space: pre-wrap; word-break: break-word; font-family: monospace; font-size: 10px; background: #fff; border: 1px solid #eee; border-radius: 4px; padding: 6px; margin: 6px 0 0; max-height: 80px; overflow: hidden; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.4px; }
  .badge-pass { background: #e5f7ee; color: #14804a; }
  .badge-fail { background: #fdeaea; color: #c81e1e; }
  .badge-flaky { background: #fdf3e3; color: #b7791f; }
  .badge-skip { background: #eef1f4; color: #52606d; }
  .case-status { white-space: nowrap; }
  .case-title { font-weight: 600; }
  .case-meta { color: #7b8794; font-size: 10px; white-space: nowrap; }
  .footer { margin-top: 28px; border-top: 1px solid #e4e7eb; padding-top: 8px; font-size: 10px; color: #7b8794; }
  @media print {
    body { padding: 0; }
  }
</style>
</head>
<body>
  <h1>Laporan Hasil Pengujian Otomatis</h1>
  <p class="muted">Waktu eksekusi: ${formatDate(aggregate.startTime)}</p>
  <p class="muted">Durasi total: ${formatDuration(aggregate.duration)}</p>

  <div class="summary">
    <div class="card card-neutral"><div class="num">${total}</div><div class="label">Total Test</div></div>
    <div class="card card-ok"><div class="num">${passed}</div><div class="label">Passed</div></div>
    <div class="card card-danger"><div class="num">${failed}</div><div class="label">Failed</div></div>
    <div class="card card-warning"><div class="num">${flaky}</div><div class="label">Flaky</div></div>
    <div class="card card-neutral"><div class="num">${skipped}</div><div class="label">Skipped</div></div>
    <div class="card ${passRate >= 95 ? 'card-ok' : passRate >= 80 ? 'card-warning' : 'card-danger'}"><div class="num">${passRate}%</div><div class="label">Pass Rate</div></div>
  </div>

  <h2>Ringkasan per Layer</h2>
  ${layerTable(aggregate.layers)}

  <h2>Detail Test Case (${aggregate.cases.length})</h2>
  <table>
    <thead>
      <tr>
        <th>Status</th>
        <th>Test Case</th>
        <th>Layer</th>
        <th>Lokasi</th>
        <th>Durasi</th>
      </tr>
    </thead>
    <tbody>${caseRows(aggregate.cases)}</tbody>
  </table>

  <h2>Daftar Test Gagal</h2>
  ${failureRows(aggregate.failures)}

  <h2>Catatan Temuan (${FINDINGS.length})</h2>
  <table>
    <thead>
      <tr>
        <th style="width:14%">Kode</th>
        <th style="width:16%">Kategori / Status</th>
        <th style="width:30%">Judul</th>
        <th>Detail</th>
      </tr>
    </thead>
    <tbody>${findingRows()}</tbody>
  </table>

  <p class="footer">Sumber data: ${aggregate.source}</p>
</body>
</html>`;
}
