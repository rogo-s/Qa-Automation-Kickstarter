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
  await webview.locator('main button', { hasText: 'Tambah PSP' }).click();
  await webview.waitForTimeout(2500);
  const form = webview.locator('main form').last();
  const save = () => form.locator('button[type="submit"]').isDisabled();

  const UNIQ = Date.now().toString().slice(-5);
  await form.locator('input[name="code"]').fill('QAPSP' + UNIQ);
  await form.locator('input[name="type"]').fill('VA');
  await form.locator('input[name="fullName"]').fill('QA PSP ' + UNIQ);
  await form.locator('input[name="simpleName"]').fill('QAPSP');
  const setText = async (nth: number, v: string) => {
    const inp = form.locator('input[placeholder="0"]').nth(nth);
    await inp.click();
    await webview.keyboard.press('ControlOrMeta+A');
    await webview.keyboard.type(v);
    await webview.waitForTimeout(400);
  };
  await setText(0, '10000');
  await setText(1, '10000000');
  await form.locator('input[name="vaPrefix"]').fill('99991');
  await form.locator('input[name="integratorUrl"]').fill('https://api.qa.test/callback');
  await form.locator('input[name="integratorSecret"]').fill('sec12345');
  await form.locator('button', { hasText: 'Pilih Rekening' }).click();
  await webview.waitForTimeout(1200);
  await webview.locator('[role="option"]', { hasText: 'Settlement BNI' }).first().click();
  await webview.waitForTimeout(800);
  await form.locator('button', { hasText: 'Pilih Tipe Settlement' }).click();
  await webview.waitForTimeout(1200);
  await webview.locator('[role="option"]', { hasText: 'Bulk' }).first().click();
  await webview.waitForTimeout(800);
  console.log('disabled before howToPay:', await save());

  // isi Quill editor
  const ql = form.locator('.ql-editor');
  console.log('ql count:', await ql.count());
  await ql.click();
  await webview.keyboard.type('Pembayaran via transfer ke nomor VA.');
  await webview.waitForTimeout(800);
  console.log('howToPay text:', JSON.stringify(await ql.innerText()));
  console.log('disabled after howToPay:', await save());

  if (!(await save())) {
    await form.locator('button[type="submit"]').click();
    await webview.waitForTimeout(3000);
    console.log('h2 after save:', JSON.stringify((await webview.locator('main h2').allTextContents()).map(t => t.trim())));
    // cari
    await webview.locator('main input#search').fill(UNIQ);
    await webview.waitForTimeout(1500);
    console.log('row:', JSON.stringify((await webview.locator('main tbody tr').first().innerText().catch(()=>'NO')).replace(/\n/g, ' | ')));
  }
  await browser.close();
})();
