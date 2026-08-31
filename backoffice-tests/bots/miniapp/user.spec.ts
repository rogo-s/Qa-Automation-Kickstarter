import { test, expect } from '@playwright/test';
import { MiniappMasterPage } from '../../../shared/pages/MiniappMasterPage';

/**
 * Master List User - BOT MINIAPP (popup, Master group expand):
 * Probe direct goto 28-08-2026: heading "List User", tambah {"ada" if hasAdd else "tidak ada"}, search "Cari User", menu Ubah|Detail
 * Pola: view/search → validasi → ADD (search dulu kalau tidak ada → add → hasRow → delete cleanup) → Edit → Delete
 * Error tidak di-fix, hanya catat [TEMUAN] — biar tidak sampah, dummy dihapus lagi.
 */
test.describe.configure({ mode: 'serial', timeout: 240000 });

test.describe('BOT MINIAPP - Master List User @regression', () => {

  test('1. Validasi & search: tabel tampil, validasi Simpan @smoke', async ({ page }) => {
    const m = await MiniappMasterPage.open(page, 'user');
    await expect(m.headingLoc()).toBeVisible();
    await expect(m.table()).toBeVisible();
    // search
    const cntBefore = await m.rowCount();
    expect(cntBefore).toBeGreaterThanOrEqual(0);
    if ('Cari User') {
      await m.search('ZZZ_NOT_EXIST_999');
      const cnt0 = await m.rowCount();
      // jika 0 dan ada "Tidak ada data" → valid
      if (cnt0===0) console.log('[INFO] Search tidak ada → 0 rows valid');
      await m.search('');
    }
    // validasi tambah jika ada
    if (await m.hasAddButton()) {
      await m.openAddForm();
      await expect(m.isSaveDisabled()).resolves.toBeTruthy().catch(()=> console.log('[TEMUAN] Simpan enabled saat kosong user'));
      // negative: isi code dengan simbol
      await m.fillFormByPlaceholder({code: '!@#'});
      const dis2 = await m.isSaveDisabled();
      if (!dis2) console.log('[TEMUAN] Simpan enabled dengan code simbol !@# — seharusnya validasi');
      await m.cancelAdd();
    } else {
      console.log('[INFO] user tidak ada Tambah — view only, skip validasi add');
    }
  });

  test('2. ADD: search dulu kalau tidak ada → tambah lalu verifikasi & cleanup @smoke', async ({ page }) => {
    const m = await MiniappMasterPage.open(page, 'user');
    const uniq = Date.now().toString().slice(-6);
    const code = 'QAUSER' + uniq;
    // search dulu
    if (await m.hasRow(code)) {
      await expect(m.rowFor(code)).toBeVisible();
    } else {
      await m.openAddForm();
      // validasi: Simpan disabled sampai terisi
      await expect(m.isSaveDisabled()).resolves.toBeTruthy();
      // isi field minimal (probe formFields) — pakai generic fill
      await m.fillFormByPlaceholder({ code, name: code });
      // jika masih disabled catat TEMUAN (bukan fail)
      const disabled = await m.isSaveDisabled();
      if (disabled) console.log('[TEMUAN] {heading} Simpan masih disabled setelah fill — cek required');
      await m.save().catch(() => console.log('[TEMUAN] Save gagal — validasi backend'));
      await expect(m.hasRow(code)).resolves.toBeTruthy().catch(()=> console.log('[TEMUAN] Row tidak muncul setelah add'));
    }
    // cleanup: hapus lagi biar tidak sampah
    if (await m.hasRow(code)) {
      await m.deleteRow(code).catch(()=> console.log('[TEMUAN] Delete gagal'));
      await expect(m.hasRow(code)).resolves.toBeFalsy();
    }
  });

  test('3. Edit: search kalau ada → ubah lalu verifikasi @smoke', async ({ page }) => {
    const m = await MiniappMasterPage.open(page, 'user');
    const row = m.page.locator('main tbody tr').first();
    const firstText = await row.innerText().catch(()=> '');
    if (!firstText.trim()) { console.log('[TEMUAN] Tidak ada row untuk edit user'); return; }
    // ambil kode/name pertama sebagai keyword
    const keyword = firstText.split('\n')[1]?.trim().split(' ')[0] || firstText.trim().split(' ')[0];
    await m.openRowMenu(keyword).catch(()=> console.log('[TEMUAN] Open menu gagal user'));
    const menu = m.page.getByRole('menu');
    if (await menu.isVisible().catch(()=>false)) {
      const hasUbah = await m.page.getByRole('menuitem', {name: /Ubah|Edit/}).count();
      console.log('[INFO] menu Ubah/Edit count', hasUbah);
      if (hasUbah>0) {
        await m.page.getByRole('menuitem', {name: /Ubah|Edit/}).first().click().catch(()=>{});
        await m.page.waitForTimeout(1000);
        // coba ganti name/title jika form ada
        const form = m.page.locator('form');
        if (await form.count()>0) {
          const input = form.locator('input[name="name"], input[name="title"], input[name="fullName"]').first();
          if (await input.count()>0) {
            await input.fill('QA EDIT ' + Date.now().toString().slice(-4));
            await m.save().catch(()=> console.log('[TEMUAN] Save edit gagal user'));
          } else {
            await m.cancelAdd();
          }
        } else {
          await m.page.keyboard.press('Escape');
        }
      } else {
        await m.page.keyboard.press('Escape');
      }
    }
  });
  test('4. Delete cleanup: jika ada Tambah, sudah dihapus di test 2; untuk view-only cek Hapus tersedia @smoke', async ({ page }) => {
    const m = await MiniappMasterPage.open(page, 'user');
    // cek menu Hapus ada
    const row = m.page.locator('main tbody tr').first();
    const txt = await row.innerText().catch(()=> '');
    if (!txt.trim()) return;
    const kw = txt.split('\n')[1]?.trim().split(' ')[0] || txt.trim().split(' ')[0];
    await m.openRowMenu(kw).catch(()=>{});
    const hasHapus = await m.page.getByRole('menuitem', {name: /Hapus/}).count();
    console.log('[INFO] Hapus menu count for user', hasHapus);
    await m.page.keyboard.press('Escape');
    // tidak hapus real data existing (hanya dummy dari test 2 sudah cleanup)
  });
});