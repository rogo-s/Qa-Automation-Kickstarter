# QA Automation Demo — Kickstarter Project

Project demo Playwright untuk latihan sebelum implementasi automation di environment kerja nyata.
Struktur project ini sengaja dibuat **mirip** dengan setup yang akan dipakai di pekerjaan (API Core, Back Office, End User App, multi-environment) tapi menggunakan situs demo publik yang aman untuk latihan.

## Studi Kasus

| Layer | Target | Representasi |
|---|---|---|
| API Core | https://dummyjson.com | Dummy REST API (auth, users, products, carts, posts, dll.) |
| Back Office | https://iconnet-portal-backoffice-playground.lentera-app.id | Portal BOT: login OTP, role master, user master, menu |
| End User App | https://www.saucedemo.com | Login, cart, checkout flow |
| Unit Test | (lokal) | Agregasi data & PDF report |

## Cakupan Test Terkni

| Layer | Jumlah Test | File Spec |
|---|---|---|
| API Core | 80 | `api-tests/` (10 file) |
| Back Office (Portal BOT) | 9 | `backoffice-tests/bot-portal/` + `backoffice-tests/portal/` (3 file) |
| End User App | 54 | `app-tests/` (7 file) |
| Unit Test | 5 | `unit-tests/` (1 file) |
| **Total (aktif)** | **148** | **21 file** |

Test demo the-internet (66 test / 24 file) disimpan terpisah di `backoffice-tests/demo/` dan **tidak ikut run** default.

Setiap skenario dipetakan ke test data dan expected result di `docs/test-data-mapping-*.md`.

## Setup

```bash
npm install
npx playwright install   # download browser (Chromium, Firefox, WebKit)
```

## Menjalankan Test

```bash
npm test                    # semua test, semua layer (api, backoffice, app, unit)
npm run test:api            # API core saja
npm run test:backoffice     # back office (portal BOT) saja
npm run test:app            # end user app saja
npm run test:unit           # unit test saja
npm run test:smoke          # hanya test yang di-tag @smoke
npm run test:regression     # hanya test yang di-tag @regression
npm run test:headed         # jalankan dengan browser terlihat (bukan headless)
npm run report              # buka laporan hasil test terakhir
npm run report:pdf          # buat laporan PDF rekap dari run terakhir
```

Setara dengan `npm run test:<layer>`:

```bash
npx playwright test --project=api
npx playwright test --project=backoffice
npx playwright test --project=app
npx playwright test --project=unit
```

Contoh dengan environment staging:

```bash
TEST_ENV=staging npm test
TEST_ENV=dev npx playwright test --project=api
```

### Laporan PDF Rekap Test Run

Setiap `npm test` menyimpan hasil ke `test-results/report.json` (JSON reporter). Dari file itu, PDF rekap bisa dibuat kapan pun:

```bash
npm run report:pdf                          # semua layer dalam satu PDF
npm run report:pdf -- --project backoffice  # satu layer saja (api|backoffice|app)
npm run report:pdf -- --input <path>        # pakai hasil run lain (mis. dari CI)
```

Output: `test-results/pdf/report-<YYYYMMDD-HHmmss>.pdf`

Isi PDF: header (waktu & durasi run), kartu ringkasan (total/pass/fail/flaky/skipped/pass-rate), tabel breakdown per layer, dan daftar test gagal dengan lokasi & pesan error. PDF dibuat dari template HTML (`shared/pdf/template.ts`) dan dicetak via Chromium — cocok dibagikan ke stakeholder non-teknis.

## Struktur Folder

```
qa-automation-demo/
├── config/                  # config per environment (local/dev/staging)
├── api-tests/               # test API Core (dummyjson.com)
├── backoffice-tests/
│   ├── bot-portal/          # test master data portal BOT (role, user, menu)
│   ├── portal/              # test login & BOT selector portal BOT
│   └── demo/                # arsip test demo the-internet (tidak ikut run)
├── app-tests/               # test End User App (saucedemo.com)
├── unit-tests/              # unit test (agregasi PDF report)
├── scripts/                 # script pendukung (generate PDF report)
├── shared/
│   ├── pages/               # Page Object Model (satu file per halaman/komponen)
│   ├── fixtures/            # custom fixture Playwright (misal auto-login app)
│   ├── pdf/                 # template HTML & agregasi data untuk PDF report
│   └── test-data/           # data test terpusat (users.json, api.json, app.json, backoffice.json)
├── docs/                    # dokumentasi mapping skenario test → test data
├── playwright.config.ts     # config utama, berisi 4 "project": api, backoffice, app, unit
└── package.json
```

## Test Data Terpusat

Data test tidak di-hardcode di file spec, melainkan disimpan per layer:

| File | Isi |
|---|---|
| `shared/test-data/users.json` | Kredensial user semua layer (app, backoffice, api) |
| `shared/test-data/api.json` | Payload & skenario API (auth, products, carts, recipes, dll.) |
| `shared/test-data/app.json` | User, produk, sort, checkout, pesan error (saucedemo) |
| `shared/test-data/backoffice.json` | Data dashboard back office (tabel, form, alert, dll.) |

Dokumentasi mapping lengkap ada di:
- `docs/test-data-mapping.md` — API Core
- `docs/test-data-mapping-app.md` — End User App
- `docs/test-data-mapping-backoffice.md` — Back Office

## Cakupan Back Office (Portal BOT)

Modul yang diotomatisasi di `backoffice-tests/` (target portal BOT playground):

- **Setup session** — `auth.setup.ts` login OTP sekali, dipakai bersama oleh project backoffice (dependency `setup`)
- **Login** — login dengan kredensial valid, login gagal dengan password salah (`portal/login.spec.ts`)
- **BOT selector** — memilih bot menampilkan semua menu sidebar (`portal/bot-selector.spec.ts`)
- **Master data** — tambah & verifikasi role, user, dan form menu (`bot-portal/master-flow.spec.ts`)

> **Test demo the-internet** (checkboxes, dropdown, frames, dll.) diarsipkan di `backoffice-tests/demo/`
> sebagai materi latihan dan di-ignore dari run default via `testIgnore` di `playwright.config.ts`.
> Untuk menjalankannya manual: `npx playwright test backoffice-tests/demo/<nama-file>`.

## Konsep yang Dilatih di Project Ini

1. **Page Object Model** — selector terpusat di `shared/pages/`, bukan tersebar di tiap test
2. **Test data terpisah** — semua kredensial & payload ada di `shared/test-data/*.json`
3. **Tagging** — `@smoke`, `@regression`, `@critical` untuk eksekusi parsial (mirip gate dev/staging/prod)
4. **Multi-project config** — `api`, `backoffice`, `app` dipisah tapi jalan dari satu config
5. **API + UI dalam satu framework** — tidak perlu tool berbeda untuk API dan UI test
6. **Custom fixture** — login berulang dibungkus fixture agar test fokus pada skenario
7. **Multi-environment** — base URL per environment via `TEST_ENV` (`config/index.ts`)
8. **PDF reporting** — hasil run dicetak jadi PDF (HTML template → Chromium `page.pdf()`)

## Langkah Setelah Demo Ini Stabil

1. Push project ini ke repo Git pribadi, coba jalankan via GitHub Actions
2. Ganti `baseURL` di `playwright.config.ts` dan file di `config/` dengan URL environment dev perusahaan
3. Tulis ulang `shared/pages/` sesuai selector produk asli
4. Terapkan gate: smoke test di dev, full regression di staging, smoke read-only di prod

Lihat juga `AGENT_INSTRUCTIONS.md` untuk instruksi terstruktur yang bisa diproses AI coding agent (opencode/ollama).
