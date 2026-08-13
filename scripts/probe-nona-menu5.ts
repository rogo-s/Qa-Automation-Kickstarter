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
  await webview.goto(WEBVIEW + '/master/menu');
  await webview.waitForTimeout(3000);

  const UNIQ = Date.now().toString().slice(-5);
  const title = 'QA MENU ' + UNIQ;
  const code = 'qamenu' + UNIQ;
  const form = () => webview.locator('main form').last();
  const save = () => form().locator('button[type="submit"]').isDisabled();
  const search = webview.locator('main input#search');

  await webview.locator('main button', { hasText: 'Tambah Menu' }).click();
  await webview.waitForTimeout(2000);
  await form().locator('input[name="title"]').fill(title);
  console.log('save disabled after title:', await save());
  await form().locator('input[name="code"]').fill(code);
  await form().locator('input[name="icon"]').fill('lucide-circle');
  await form().locator('button', { hasText: 'Pilih parent menu' }).click();
  await webview.waitForTimeout(1200);
  await webview.locator('[role="option"]', { hasText: 'Master' }).first().click();
  await webview.waitForTimeout(800);
  await form().locator('button', { hasText: 'Default' }).click();
  await webview.waitForTimeout(1200);
  await webview.locator('[role="option"]', { hasText: '3' }).first().click();
  await webview.waitForTimeout(800);
  await form().locator('input[name="permissionString"]').fill('CREATE,EDIT,VIEW,DELETE,READ');
  await form().locator('textarea[name="description"]').fill('Menu QA test');
  console.log('save disabled after all fields (switch unchecked):', await save());
  await form().locator('[role="switch"]').click({ force: true });
  await webview.waitForTimeout(500);
  console.log('save disabled after switch checked:', await save());
  await form().locator('button[type="submit"]').click();
  await webview.waitForTimeout(3000);
  console.log('h2 after save:', JSON.stringify((await webview.locator('main h2').allTextContents()).map(t => t.trim())));

  await search.fill(UNIQ);
  await webview.waitForTimeout(1500);
  console.log('row:', JSON.stringify((await webview.locator('main tbody tr').first().innerText().catch(() => 'NO')).replace(/\n/g, ' | ')));

  console.log('== EDIT ==');
  await webview.locator('main tbody tr').first().getByRole('button', { name: 'Open menu' }).click();
  await webview.waitForTimeout(800);
  console.log('menu:', JSON.stringify((await webview.locator('[role="menuitem"]').allTextContents()).map(t => t.trim())));
  await webview.getByRole('menuitem', { name: 'Ubah' }).click();
  await webview.waitForTimeout(2000);
  console.log('edit title:', await form().locator('input[name="title"]').inputValue());
  console.log('edit code:', await form().locator('input[name="code"]').inputValue());
  console.log('edit icon:', await form().locator('input[name="icon"]').inputValue());
  console.log('edit parent btn:', (await form().locator('button').filter({ hasText: 'Master' }).first().textContent())?.trim());
  console.log('edit urutan btn:', (await form().locator('button').filter({ hasText: /^3$|^Default$|^[1-5]$/ }).first().textContent())?.trim());
  console.log('edit perm:', await form().locator('input[name="permissionString"]').inputValue());
  console.log('edit switch:', await form().locator('[role="switch"]').getAttribute('data-state'));
  console.log('edit save disabled:', await save());
  // edit nama
  await form().locator('input[name="title"]').fill(title + 'X');
  await form().locator('input[name="permissionString"]').fill('CREATE,EDIT,VIEW,DELETE');
  console.log('save disabled after edit field:', await save());
  await form().locator('button[type="submit"]').click();
  await webview.waitForTimeout(3000);
  await search.fill(UNIQ);
  await webview.waitForTimeout(1500);
  console.log('row after edit:', JSON.stringify((await webview.locator('main tbody tr').first().innerText().catch(()=>'NO')).replace(/\n/g, ' | ')));
  await browser.close();
})();
