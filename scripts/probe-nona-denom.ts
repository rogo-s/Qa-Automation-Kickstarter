import { chromium } from '@playwright/test';
import { config } from '../config';

const WEBVIEW = 'https://backoffice-ppob-nona-webview-playground.lentera-app.id';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: '.auth/portal.json', baseURL: config.backoffice_base_url });
  const page = await context.newPage();
  await page.goto('/');
  await page.getByText('Pilih BOT Anda').waitFor({ timeout: 15000 });
  const card = page.locator('div.p-4.border.rounded-lg', { hasText: 'BOT PPOB NONA' }).first();
  const popupPromise = page.waitForEvent('popup');
  await card.getByRole('button', { name: 'Masuk' }).click();
  const webview = await popupPromise;
  await webview.waitForURL(/backoffice-ppob-nona-webview-playground\.lentera-app\.id\/?$/, { timeout: 30000 });
  await webview.waitForTimeout(1500);

  await webview.goto(WEBVIEW + '/master/denom');
  await webview.waitForTimeout(3000);

  const uniq = '900' + String(Date.now()).slice(-5);
  await webview.getByRole('button', { name: 'Tambah Denom' }).click();
  await webview.waitForTimeout(2500);
  const dialog = webview.getByRole('dialog');
  await dialog.locator('input[name="denom"]').fill(uniq);
  await dialog.getByRole('combobox').click();
  await webview.waitForTimeout(1200);
  await webview.locator('[role="option"]', { hasText: 'Prepaid Kompor Listrik' }).first().click();
  await webview.waitForTimeout(1000);
  const comboText = await dialog.getByRole('combobox').textContent();
  console.log('combo setelah pilih kompor:', JSON.stringify(comboText));
  await dialog.getByRole('button', { name: 'Simpan' }).click();
  await webview.waitForTimeout(2500);

  // cek toast
  const toast = await webview.evaluate(() => {
    const t = document.querySelector('[data-slot="toast"], [role="status"], [role="alert"]');
    return t ? t.textContent?.replace(/\s+/g, ' ').trim().slice(0, 150) : 'none';
  });
  console.log('=== TOAST ===', JSON.stringify(toast));

  // filter Kompor dan cari
  await webview.getByRole('button', { name: 'Filter' }).first().click();
  await webview.waitForTimeout(2000);
  await webview.locator('[role="dialog"]').getByText('Prepaid Kompor Listrik').click();
  await webview.waitForTimeout(500);
  await webview.locator('[role="dialog"]').getByRole('button', { name: 'Terapkan' }).click();
  await webview.waitForTimeout(3000);
  const rows = await webview.evaluate(() =>
    Array.from(document.querySelectorAll('main tbody tr')).map((r) => r.textContent?.replace(/\s+/g, ' ').trim()),
  );
  const foundKompor = rows.findIndex((r) => r?.includes(uniq));
  console.log('di filter Kompor, denom baru di baris:', foundKompor + 1);
  rows.forEach((r, i) => console.log(i + 1, '|', r));

  // filter Prepaid dan cari
  await webview.getByRole('button', { name: 'Filter' }).first().click();
  await webview.waitForTimeout(2000);
  await webview.locator('[role="dialog"]').getByText('Prepaid Kompor Listrik').click(); // unselect
  await webview.locator('[role="dialog"]').getByText('Prepaid').first().click();
  await webview.waitForTimeout(500);
  await webview.locator('[role="dialog"]').getByRole('button', { name: 'Terapkan' }).click();
  await webview.waitForTimeout(3000);
  const rows2 = await webview.evaluate(() =>
    Array.from(document.querySelectorAll('main tbody tr')).map((r) => r.textContent?.replace(/\s+/g, ' ').trim()),
  );
  const foundPrepaid = rows2.findIndex((r) => r?.includes(uniq));
  console.log('di filter Prepaid, denom baru di baris:', foundPrepaid + 1);
  rows2.slice(0, 8).forEach((r, i) => console.log(i + 1, '|', r));

  await browser.close();
})();