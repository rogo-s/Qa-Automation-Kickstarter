import { chromium } from '@playwright/test';
import { config } from '../config';

const WEBVIEW = 'https://backoffice-ppob-nona-webview-playground.lentera-app.id';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: '.auth/portal.json', baseURL: config.backoffice_base_url });
  const page = await context.newPage();
  let webview;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.goto('/');
      await page.getByText('Pilih BOT Anda').waitFor({ timeout: 15000 });
      const card = page.locator('div.p-4.border.rounded-lg', { hasText: 'BOT PPOB NONA' }).first();
      const popupPromise = page.waitForEvent('popup', { timeout: 20000 });
      await card.getByRole('button', { name: 'Masuk' }).click();
      webview = await popupPromise;
      await webview.waitForURL(/backoffice-ppob-nona-webview-playground\.lentera-app\.id\/?$/, { timeout: 30000 });
      await webview.waitForTimeout(1500);
      break;
    } catch { await page.waitForTimeout(2000); }
  }
  if (!webview) throw new Error('popup gagal');
  await webview.goto(WEBVIEW + '/master/bank');
  await webview.waitForTimeout(2500);

  const nama = 'QA REL ' + Date.now().toString().slice(-6);
  await webview.getByRole('button', { name: 'Tambah Bank' }).first().click();
  await webview.waitForTimeout(1000);
  await webview.locator('input[name="name"]').fill(nama);
  await webview.locator('input[name="code"]').fill('QAREL' + Date.now().toString().slice(-4));
  await webview.locator('input[name="short_name"]').fill('QAR');
  await webview.locator('input[name="swift_code"]').fill('QARCIDJB');
  // cek disabled dengan poll sampai enabled
  for (let i = 0; i < 10; i++) {
    const d = await webview.locator('form button[type="submit"]').isDisabled().catch(() => true);
    if (!d) { console.log('enabled setelah poll ke:', i); break; }
    await webview.waitForTimeout(500);
  }
  await webview.locator('form button[type="submit"]').click();
  await webview.waitForTimeout(2500);

  // delete + reload untuk verifikasi
  await webview.locator('main input#search').fill(nama);
  await webview.waitForTimeout(1500);
  console.log('sebelum hapus, rows:', await webview.locator('main tbody tr').count());
  await webview.locator('main tbody tr').first().getByRole('button', { name: 'Open menu' }).click();
  await webview.waitForTimeout(800);
  await webview.getByRole('menuitem', { name: 'Hapus' }).click();
  await webview.waitForTimeout(1200);
  await webview.getByRole('button', { name: 'Lanjutkan' }).click();
  await webview.waitForTimeout(3000);
  // RELOAD bukti pasti
  await webview.goto(WEBVIEW + '/master/bank');
  await webview.waitForTimeout(2500);
  await webview.locator('main input#search').fill(nama);
  await webview.waitForTimeout(2000);
  console.log('setelah hapus+reload, rows:', await webview.locator('main tbody tr').count());

  await browser.close();
})();