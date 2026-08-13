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
  await webview.goto(WEBVIEW + '/master/cutoff');
  await webview.waitForTimeout(2500);
  await webview.locator('main button', { hasText: /Tambah Cutoff/i }).click();
  await webview.waitForTimeout(2000);
  const form = webview.locator('form').last();

  const kode = 'QACUT' + Date.now().toString().slice(-5);
  const nama = 'QA CUTOFF ' + Date.now().toString().slice(-5);

  await form.locator('input[name="name"]').fill(nama);
  await form.locator('input[name="code"]').fill(kode);
  await form.locator('button').filter({ hasText: /Tipe|Once|Daily|Weekly|Monthly/ }).first().click();
  await webview.waitForTimeout(1000);
  await webview.locator('[role="option"]', { hasText: 'Daily' }).first().click();
  await webview.waitForTimeout(1200);

  const setTime = async (ph: string, val: string) => {
    const inp = form.locator(`input[placeholder="${ph}"]`).first();
    await inp.click();
    await webview.waitForTimeout(600);
    await webview.keyboard.press('ControlOrMeta+A');
    await webview.keyboard.type(val);
    await webview.waitForTimeout(600);
    await webview.keyboard.press('Enter');
    await webview.waitForTimeout(600);
    console.log(`${ph} =`, await inp.inputValue());
  };
  await setTime('Pilih waktu', '13:30:00');
  await setTime('Pilih Durasi', '02:00:00');

  await form.locator('button', { hasText: 'Pilih PSP' }).first().click();
  await webview.waitForTimeout(1500);
  await webview.locator('[role="option"]', { hasText: 'Bank Mega' }).first().click();
  await webview.waitForTimeout(1000);

  const saveBtn = form.locator('button[type="submit"]');
  console.log('save disabled sebelum switch:', await saveBtn.isDisabled());

  const sw = form.locator('[role="switch"]');
  console.log('switch state:', await sw.getAttribute('data-state'));
  await sw.click({ force: true });
  await webview.waitForTimeout(800);
  console.log('switch state setelah:', await sw.getAttribute('data-state'));
  console.log('save disabled setelah switch:', await saveBtn.isDisabled());

  await browser.close();
})();