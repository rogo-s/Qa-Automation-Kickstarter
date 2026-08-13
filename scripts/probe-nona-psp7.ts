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

  // identifkasi amount input by label
  const labels = await form.locator('label').allTextContents();
  console.log('labels:', JSON.stringify(labels.map(t => t.trim()).filter(Boolean)));
  const amountInputs = form.locator('input[placeholder="0"]');
  const minAmt = amountInputs.nth(0);
  const maxAmt = amountInputs.nth(1);

  const setText = async (sel: string, v: string) => {
    const inp = form.locator(sel).first();
    await inp.click();
    await webview.keyboard.press('ControlOrMeta+A');
    await webview.keyboard.type(v);
    await webview.waitForTimeout(400);
  };

  await form.locator('input[name="code"]').fill('QAPSP' + Date.now().toString().slice(-5));
  console.log('disabled after code:', await save());
  await form.locator('input[name="type"]').fill('VA');
  await form.locator('input[name="fullName"]').fill('QA PSP Test');
  await form.locator('input[name="simpleName"]').fill('QAPSP');
  await setText('input[placeholder="0"] >> nth=0', '10000');
  console.log('disabled after text fields:', await save());
  await setText('input[placeholder="0"] >> nth=1', '10000000');
  await form.locator('input[name="vaPrefix"]').fill('99991');
  await form.locator('input[name="integratorUrl"]').fill('https://api.qa.test/callback');
  await form.locator('input[name="integratorSecret"]').fill('sec12345');
  await webview.waitForTimeout(600);
  console.log('disabled after all fields:', await save());

  // Rekening
  await form.locator('button', { hasText: 'Pilih Rekening' }).click();
  await webview.waitForTimeout(1200);
  await webview.locator('[role="option"]', { hasText: 'Settlement BNI' }).first().click();
  await webview.waitForTimeout(800);
  console.log('disabled after rekening:', await save());

  // Tipe Settlement
  await form.locator('button', { hasText: 'Pilih Tipe Settlement' }).click();
  await webview.waitForTimeout(1200);
  await webview.locator('[role="option"]', { hasText: 'Bulk' }).first().click();
  await webview.waitForTimeout(800);
  console.log('disabled after tipe settlement:', await save());

  // switch
  console.log('switch state:', await form.locator('[role="switch"]').getAttribute('data-state'));
  console.log('disabled akhir (switch default):', await save());
  await browser.close();
})();
