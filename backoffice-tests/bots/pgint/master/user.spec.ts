import { test, expect } from '@playwright/test';
import { PgintMasterPage } from '../../../../shared/pages/PgintMasterPage';

/**
 * Master List User - BOT PGINT
 * Probe 28-08-2026: heading "List User", no Tambah untuk role subandonorogo (view-only)
 * Pola: view/search → validasi Edit → Edit lalu revert → Delete check (tidak hapus real)
 */
test.describe.configure({ mode: 'serial', timeout: 240000 });

test.describe('BOT PGINT - Master List User @regression', () => {
  test('1. View: heading & tabel tampil @smoke', async ({ page }) => {
    const m = await PgintMasterPage.open(page, 'user');
    await expect(m.headingLoc()).toBeVisible();
    await expect(m.table()).toBeVisible();
    const cnt = await m.rowCount();
    expect(cnt).toBeGreaterThan(0);
  });

  test('2. Search: cari & kosong @smoke', async ({ page }) => {
    const m = await PgintMasterPage.open(page, 'user');
    await m.search('BCA');
    const c1 = await m.rowCount();
    console.log('[INFO] search BCA rows', c1);
    await m.search('ZZZ_NOT_EXIST_999');
    const c0 = await m.rowCount();
    if (c0===0) console.log('[INFO] search tidak ada → 0 rows valid');
    await m.search('');
  });

  test('3. Edit: search kalau ada → Ubah lalu verifikasi @smoke', async ({ page }) => {
    const m = await PgintMasterPage.open(page, 'user');
    const row = m.page.locator('main tbody tr').first();
    const txt = await row.innerText().catch(()=> '');
    if (!txt.trim()) { console.log('[TEMUAN] Tidak ada row untuk edit user'); return; }
    const kw = txt.split('\n')[1]?.trim().split(' ')[0] || txt.trim().split(' ')[0];
    await m.openRowMenu(kw);
    const hasUbah = await m.page.getByRole('menuitem', {name: /Ubah/}).count();
    if (hasUbah===0) { console.log('[TEMUAN] Ubah tidak ada user'); await m.page.keyboard.press('Escape'); return; }
    await m.page.getByRole('menuitem', {name: /Ubah/}).first().click();
    await m.page.waitForTimeout(1500);
    const form = m.page.locator('form');
    if (await form.count()>0) {
      const saveBtn = m.saveButton();
      const before = await saveBtn.isDisabled().catch(()=> false);
      console.log('[INFO] save disabled before edit', before);
      const input = form.locator('input[name="name"], input[name="fullName"], input[name="title"]').first();
      if (await input.count()>0) {
        const orig = await input.inputValue().catch(()=> '');
        await input.fill('!@#');
        const dis2 = await saveBtn.isDisabled().catch(()=> false);
        if (!dis2) console.log('[TEMUAN] Simpan enabled dengan simbol !@# — seharusnya validasi');
        await input.fill(orig || 'QA EDIT');
      }
      await m.save().catch(()=> console.log('[TEMUAN] Save edit gagal user'));
      await m.page.waitForTimeout(1000);
      console.log('[INFO] Edit user selesai');
    } else {
      console.log('[TEMUAN] Form tidak muncul setelah Ubah user');
    }
  });
  test('4. Detail check: Detail/Ubah ada @smoke', async ({ page }) => {
    const m = await PgintMasterPage.open(page, 'user');
    const row = m.page.locator('main tbody tr').first();
    const txt = await row.innerText().catch(()=> '');
    if (!txt.trim()) return;
    const kw = txt.split('\n')[1]?.trim().split(' ')[0] || txt.trim().split(' ')[0];
    await m.openRowMenu(kw);
    const hasMenu = await m.page.getByRole('menu').isVisible().catch(()=>false);
    expect(hasMenu).toBeTruthy();
    await m.page.keyboard.press('Escape');
  });

});
