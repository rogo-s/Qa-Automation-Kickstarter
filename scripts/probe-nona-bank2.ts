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
    } catch (err) {
      process.stdout.write(`attempt ${attempt} failed; `);
      await page.waitForTimeout(2000);
    }
  }
  if (!webview) throw new Error('popup gagal');

  await webview.goto(WEBVIEW + '/master/bank');
  await webview.waitForTimeout(2500);

  await webview.getByRole('button', { name: 'Tambah Bank' }).first().click();
  await webview.waitForTimeout(1500);

  await webview.evaluate(() => document.body.setAttribute('data-formdump', '1'));
  await webview.screenshot({ path: '/tmp/bank-form.png', fullPage: true });

  console.log('== btns visible ==');
  const btns = await webview.locator('body button').all();
  for (const b of btns) {
    const vis = await b.isVisible();
    const t = (await b.textContent())?.trim();
    if (vis && t) console.log('visible btn:', JSON.stringify(t));
  }

  console.log('== inputs visible ==');
  const bodyInputs = webview.locator('body input');
  for (let i = 0; i < await bodyInputs.count(); i++) {
    const inp = bodyInputs.nth(i);
    const vis = await inp.isVisible();
    const name = (await inp.getAttribute('name')) || '';
    const ph = (await inp.getAttribute('placeholder')) || '';
    if (vis) console.log(`input[${i}] name=${name} ph=${JSON.stringify(ph)}`);
  }

  console.log('== form full html (last 4000) ==');
  const formHtml = (await webview.locator('form').last().innerHTML()).replace(/\s+/g, ' ');
  console.log(formHtml.slice(-4000));
  console.log('== form count:', await webview.locator('form').count());
  console.log('== form attrs:', await webview.locator('form').last().evaluate((el) => el.outerHTML.slice(0, 200)));

  console.log('== save disabled? ==');
  const saveBtn = webview.getByRole('button', { name: /Simpan|Submit/ }).last();
  console.log('saveBtn count:', await saveBtn.count());
  if (await saveBtn.count()) console.log('disabled:', await saveBtn.isDisabled());

  await browser.close();
})();