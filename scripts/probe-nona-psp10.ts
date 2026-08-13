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
  console.log('STEP: buka form');
  await webview.locator('main button', { hasText: 'Tambah PSP' }).click();
  await webview.waitForTimeout(2500);
  const form = webview.locator('main form').last();
  const save = () => form.locator('button[type="submit"]').isDisabled();
  const UNIQ = Date.now().toString().slice(-5);

  console.log('STEP: isi field');
  await form.locator('input[name="code"]').fill('QAPSP' + UNIQ);
  await form.locator('input[name="type"]').fill('VA');
  await form.locator('input[name="fullName"]').fill('QA PSP ' + UNIQ);
  await form.locator('input[name="simpleName"]').fill('QAPSP');
  await form.locator('input[placeholder="0"]').nth(0).click();
  await webview.keyboard.press('ControlOrMeta+A');
  await webview.keyboard.type('10000');
  await form.locator('input[placeholder="0"]').nth(1).click();
  await webview.keyboard.press('ControlOrMeta+A');
  await webview.keyboard.type('10000000');
  await form.locator('input[name="vaPrefix"]').fill('99991');
  await form.locator('input[name="integratorUrl"]').fill('https://api.qa.test/callback');
  await form.locator('input[name="integratorSecret"]').fill('sec12345');

  console.log('STEP: rekening');
  await form.locator('button', { hasText: 'Pilih Rekening' }).click();
  await webview.waitForTimeout(1200);
  await webview.locator('[role="option"]', { hasText: 'Settlement BNI' }).first().click();
  await webview.waitForTimeout(800);

  console.log('STEP: tipe settlement');
  await form.locator('button', { hasText: 'Pilih Tipe Settlement' }).click();
  await webview.waitForTimeout(1200);
  await webview.locator('[role="option"]', { hasText: 'Bulk' }).first().click();
  await webview.waitForTimeout(800);

  console.log('disabled before howToPay:', await save());
  const ql = form.locator('.ql-editor');
  console.log('ql count:', await ql.count());
  await ql.click();
  await webview.keyboard.type('Pembayaran via transfer ke nomor VA.');
  await webview.waitForTimeout(800);
  console.log('howToPay text:', JSON.stringify(await ql.innerText()));
  console.log('disabled after howToPay:', await save());

  if (!(await save())) {
    console.log('STEP: klik simpan');
    await form.locator('button[type="submit"]').click();
    await webview.waitForTimeout(3500);
    console.log('h2:', JSON.stringify((await webview.locator('main h2').allTextContents()).map(t => t.trim())));
    console.log('STEP: cari');
    await webview.locator('main input#search').fill(UNIQ);
    await webview.waitForTimeout(1500);
    console.log('rows:', await webview.locator('main tbody tr').count());
    console.log('row:', JSON.stringify((await webview.locator('main tbody tr').first().innerText().catch(() => 'NO')).replace(/\n/g, ' | ')));
  }
  await browser.close();
  console.log('DONE');
})();
