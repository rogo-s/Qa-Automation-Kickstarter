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
  await webview.goto(WEBVIEW + '/master/psp');
  await webview.waitForTimeout(3000);
  const search = webview.locator('main input#search');
  await search.fill('19758');
  await webview.waitForTimeout(1500);
  await webview.locator('main tbody tr').first().getByRole('button', { name: 'Open menu' }).click();
  await webview.waitForTimeout(800);
  await webview.getByRole('menuitem', { name: 'Ubah' }).click();
  await webview.waitForTimeout(2500);
  const form = webview.locator('main form').last();
  const save = () => form.locator('button[type="submit"]').isDisabled();
  console.log('save disabled awal:', await save());

  // cek bagaimana ql-editor di-render saat edit (mungkin innerHTML beda)
  const ql = form.locator('.ql-editor');
  console.log('ql innerHTML:', JSON.stringify(await ql.innerHTML().catch(() => 'NO')));
  await ql.click();
  await webview.keyboard.press('ControlOrMeta+A');
  await webview.keyboard.type('Pembayaran diedit di mode edit.');
  await webview.waitForTimeout(800);
  console.log('save disabled setelah isi ql:', await save());
  if (!(await save())) {
    await form.locator('button[type="submit"]').click();
    await webview.waitForTimeout(3000);
    console.log('h2:', JSON.stringify((await webview.locator('main h2').allTextContents()).map(t => t.trim())));
    await search.fill('19758');
    await webview.waitForTimeout(1500);
    console.log('row after edit:', JSON.stringify((await webview.locator('main tbody tr').first().innerText().catch(()=>'NO')).replace(/\n/g, ' | ')));
  } else {
    console.log('MASIH DISABLED - coba isi field lain juga');
  }
  await browser.close();
})();
