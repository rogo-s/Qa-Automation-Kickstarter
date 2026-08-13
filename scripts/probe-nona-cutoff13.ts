import { chromium } from '@playwright/test';
import { config } from '../config';

const WEBVIEW = 'https://backoffice-ppob-nona-webview-playground.lentera-app.id';
const UNIQ = Date.now().toString().slice(-6);

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
    } catch (e) { console.log('attempt err:', (e as Error).message.slice(0, 120)); await page.waitForTimeout(2000); }
  }
  if (!webview) throw new Error('popup gagal');
  for (let i = 0; i < 5; i++) {
    try { await webview.goto(WEBVIEW + '/master/cutoff', { waitUntil: 'domcontentloaded', timeout: 30000 }); break; }
    catch { await webview.waitForTimeout(3000); }
  }
  await webview.waitForTimeout(2500);

  const search = webview.locator('main input[placeholder*="Cari" i]').first();
  const tbody = () => webview.locator('main tbody').textContent().catch(() => 'NO');

  const del = async (kw: string) => {
    console.log('-- delete:', kw);
    await search.fill(kw);
    await webview.waitForTimeout(1500);
    console.log('  rows after search:', await webview.locator('main tbody tr').count());
    const row = webview.locator('main tbody tr', { hasText: kw }).first();
    await row.waitFor({ state: 'visible', timeout: 10000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await webview.waitForTimeout(800);
    const menuItems = await webview.locator('[role="menuitem"]').allTextContents();
    console.log('  menu:', JSON.stringify(menuItems));
    await webview.getByRole('menuitem', { name: 'Hapus' }).click();
    await webview.waitForTimeout(1500);
    const dlgs = webview.locator('[role="dialog"], [role="alertdialog"]');
    console.log('  dialogs:', await dlgs.count());
    const btns = dlgs.last().getByRole('button');
    console.log('  dialog buttons:', JSON.stringify((await btns.allTextContents()).map((t) => t.trim())));
    await dlgs.last().getByRole('button', { name: 'Lanjutkan' }).click();
    await webview.waitForTimeout(2500);
    console.log('  tbody after delete:', JSON.stringify((await tbody())?.trim().slice(0, 60)));
    // reload & verify
    await webview.reload();
    await webview.waitForTimeout(2500);
    await search.fill(kw);
    await webview.waitForTimeout(1500);
    console.log('  tbody after reload+search:', JSON.stringify((await tbody())?.trim().slice(0, 60)));
  };

  // sebarang cleanup dari run sebelumnya yang menyisakan UNIQ lama tidak ada.
  await del('QA CUTOFF ' + UNIQ + 'X');
  await del('QA CUTOFF ONCE ' + UNIQ);

  await browser.close();
})();