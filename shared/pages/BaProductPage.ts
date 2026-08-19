import { Page, Locator, expect } from '@playwright/test';
import { BaPage } from './BaPage';

/**
 * Page Object - Master Data Manage Product pada webview BOT BA.
 * Halaman dibuka lewat popup portal, lalu sidebar Master -> Manage Product.
 *
 * Karakteristik menu Produk (hasil probe):
 *  - List menampilkan "Tunggu sebentar..." saat loading -> wajib tunggu tabel termuat.
 *  - Tambah/Ubah = halaman penuh /manage_product_internal/add|edit/<id>.
 *  - Field: name, code, Tipe Produk (select BILLING/PURCHASE), description,
 *    Biaya Admin/Komisi/Harga (input; utk BILLING Harga disabled dan
 *    Biaya Admin + Komisi WAJIB diisi — jika kosong API menolak dengan
 *    "AdminFee, CommissionFee tidak boleh kosong"), dan picker popover:
 *    kategori ("Pilih kategori"), grup ("Pilih grup"), provider ("Pilih
 *    provider"/routing) — opsi pertama adalah placeholder, pilih opsi ke-2 dst.
 *  - Status switch default CHECKED (produk baru langsung Aktif).
 *  - Sukses simpan -> kembali ke list. Duplikat kode -> tetap di halaman
 *    form + pesan "Kode produk sudah digunakan".
 *  - Hapus = konfirmasi role="alertdialog" "Apakah Anda yakin ingin
 *    menghapus Product ini?" -> Batal / Lanjutkan.
 *  - Pencarian list memakai scan teks tabel (pola sama dengan BaBankPage).
 */
export class BaProductPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Buka webview BA lewat portal lalu arahkan ke halaman Produk. */
  static async open(portalPage: Page): Promise<BaProductPage> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await BaProductPage.openOnce(portalPage);
      } catch (err) {
        lastError = err as Error;
        await portalPage.waitForTimeout(3000);
      }
    }
    throw lastError;
  }

  private static async openOnce(portalPage: Page): Promise<BaProductPage> {
    const ba = await BaPage.open(portalPage);
    await ba.openProduct();
    const page = new BaProductPage(ba.page);
    await page.waitTableLoaded();
    return page;
  }

  /** Tunggu tabel selesai loading (bukan "Tunggu sebentar..."). */
  async waitTableLoaded() {
    for (let i = 0; i < 20; i++) {
      const text = ((await this.page.locator('main tbody').textContent()) ?? '').trim();
      if (text && !text.includes('Tunggu sebentar')) return;
      await this.page.waitForTimeout(1000);
    }
  }

  // ---------- LIST ----------

  /** Cek data ada/tidak dengan scan teks tabel (semua baris tampil). */
  async hasRow(keyword: string): Promise<boolean> {
    await this.waitTableLoaded();
    const text = await this.page.locator('main tbody').textContent().catch(() => '');
    return !!text && text.includes(keyword);
  }

  rowFor(keyword: string): Locator {
    return this.page.locator('main tbody tr', { hasText: keyword }).first();
  }

  // ---------- FORM TAMBAH / UBAH ----------

  async openAddForm() {
    await this.page.getByRole('button', { name: 'Produk', exact: true }).first().click();
    await this.page.waitForURL(/\/manage_product_internal\/add$/, { timeout: 15000 });
    await expect(this.page.getByRole('heading', { name: 'Tambah Produk' })).toBeVisible({ timeout: 10000 });
  }

  async openEditForm(keyword: string) {
    const row = this.rowFor(keyword);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Ubah' }).click();
    await this.page.waitForURL(/\/manage_product_internal\/edit\/\d+$/, { timeout: 15000 });
    await expect(this.page.getByRole('heading', { name: 'Ubah Produk' })).toBeVisible({ timeout: 10000 });
  }

  async fillForm(data: { name?: string; code?: string; description?: string }) {
    if (data.name !== undefined) await this.page.locator('input[name="name"]').fill(data.name);
    if (data.code !== undefined) await this.page.locator('input[name="code"]').fill(data.code);
    if (data.description !== undefined) await this.page.locator('textarea[name="description"]').fill(data.description);
    await this.page.waitForTimeout(500);
  }

  /** Pilih Tipe Produk (select; 0 = BILLING, 1 = PURCHASE). */
  async selectTipe(index: number) {
    await this.page.locator('main select').first().selectOption({ index });
    await this.page.waitForTimeout(500);
  }

  /** Pilih opsi pada picker popover (kategori/grup/provider); lewati placeholder. */
  async pickOption(buttonText: string, optionIndex: number) {
    await this.page.locator('main button').filter({ hasText: buttonText }).first().click();
    await this.page.waitForTimeout(1500);
    await this.page.locator('[role="option"]:visible').nth(optionIndex).click();
    await this.page.waitForTimeout(1000);
  }

  /** Isi Biaya Admin / Komisi / Harga yang enabled dengan nilai yang sama. */
  async fillEnabledHarga(value: string) {
    const inputs = this.page.locator('main input[placeholder="1000"], main input[placeholder="500"], main input[placeholder="200"]');
    for (let i = 0; i < (await inputs.count()); i++) {
      const input = inputs.nth(i);
      if (!(await input.isDisabled())) {
        await input.fill(value);
        await this.page.waitForTimeout(300);
      }
    }
  }

  /** Set status aktif/nonaktif lewat switch pada form. */
  async setStatus(wantActive: boolean) {
    const sw = this.page.locator('main button[role="switch"], main [role="switch"]').first();
    const want = wantActive ? 'checked' : 'unchecked';
    if ((await sw.getAttribute('data-state')) !== want) {
      await sw.click();
      await this.page.waitForTimeout(500);
    }
  }

  saveButton(): Locator {
    return this.page.locator('main button[type="submit"]');
  }

  isSaveDisabled(): Promise<boolean> {
    return this.saveButton().isDisabled();
  }

  /** Klik Simpan. Sukses = kembali ke list; gagal = tetap di form + pesan error. */
  async save() {
    await expect(this.saveButton()).toBeEnabled({ timeout: 10000 });
    await this.saveButton().click();
    await this.page.waitForTimeout(4000);
  }

  async cancel() {
    await this.page.getByRole('button', { name: 'Kembali' }).first().click();
    await this.page.waitForURL(/\/manage_product_internal$/, { timeout: 15000 });
    await this.waitTableLoaded();
  }

  // ---------- DELETE ----------

  async deleteData(keyword: string) {
    const row = this.rowFor(keyword);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Hapus' }).click();
    const confirm = this.page.locator('[role="alertdialog"]').first();
    await expect(confirm).toBeVisible({ timeout: 10000 });
    await confirm.getByRole('button', { name: 'Lanjutkan' }).click();
    await this.page.waitForTimeout(3000);
  }
}
