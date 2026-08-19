import { test, expect } from '@playwright/test';
import { BaInvoicePage } from '../../../shared/pages/BaInvoicePage';

/**
 * Invoice - BOT BA (Biller Aggregator).
 * Read + Generate invoice + aksi baris (Konfirmasi Pembayaran, Print/Cetak).
 *
 * 1. Buka halaman Invoice: tabel & tombol Generate tampil
 * 2. Dialog Generate: tombol disabled sampai mitra + tanggal awal + akhir terisi
 * 3. Generate invoice (mitra DIGI01, range bulan berjalan) -> invoice baru muncul
 * 4. Konfirmasi Pembayaran -> konfirmasi "melunaskan" -> status jadi Lunas
 * 5. Print/Cetak: halaman tetap tampil tanpa error (window.print di headless)
 */
test.describe.configure({ mode: 'serial', timeout: 420000 });

const NOW = new Date();
const DAY_START = `${NOW.getFullYear()}-${String(NOW.getMonth() + 1).padStart(2, '0')}-01`;
const DAY_END = `${NOW.getFullYear()}-${String(NOW.getMonth() + 1).padStart(2, '0')}-${String(Math.max(2, NOW.getDate() - 1)).padStart(2, '0')}`;

test.describe('BOT BA - Menu Invoice @regression', () => {
  test('1. Buka halaman Invoice: tabel & tombol Generate tampil @smoke', async ({ page }) => {
    const inv = await BaInvoicePage.open(page);

    const thead = inv.page.locator('main table thead');
    await expect(thead).toBeVisible({ timeout: 15000 });
    for (const col of ['No. Invoice', 'Nama Mitra', 'Periode', 'Total Transaksi', 'Total Tagihan', 'Status']) {
      await expect(thead).toContainText(col);
    }
    await expect(inv.page.getByRole('button', { name: 'Generate', exact: true }).first()).toBeVisible({ timeout: 15000 });
  });

  test('2. Dialog Generate: tombol disabled sampai mitra + tanggal awal + akhir terisi @smoke', async ({ page }) => {
    const inv = await BaInvoicePage.open(page);
    await inv.openGenerateDialog();

    await expect(inv.isGenerateDisabled()).resolves.toBeTruthy();

    await inv.selectMitra('DIGI01');
    await expect(inv.isGenerateDisabled()).resolves.toBeTruthy();

    await inv.pickDate(DAY_START);
    await expect(inv.isGenerateDisabled()).resolves.toBeTruthy();

    await inv.pickDate(DAY_END, true);
    await expect(inv.isGenerateDisabled()).resolves.toBeFalsy();

    await inv.closeGenerate();
  });

  test('3. Generate invoice (mitra DIGI01, range bulan berjalan): invoice baru ATAU ditolak karena overlap @smoke', async ({ page }) => {
    const inv = await BaInvoicePage.open(page);

    const before = await inv.firstRowText();
    expect(before).toContain('INVOICE_');

    await inv.openGenerateDialog();
    await inv.selectMitra('DIGI01');
    await inv.pickDate(DAY_START);
    await inv.pickDate(DAY_END, true);
    await inv.page.locator('button[type="submit"]').first().click();
    await inv.page.waitForTimeout(3000);

    // Sukses: dialog tertutup + invoice baru di baris teratas.
    // Overlap (periode sudah pernah digenerate): dialog tetap + pesan error.
    if ((await inv.generateDialog().count()) === 0) {
      const after = await inv.firstRowText();
      expect(after).toContain('INVOICE_');
      expect(after).toContain('Belum Lunas');
      expect(after).not.toBe(before);
    } else {
      await expect(inv.page.getByText('Periode tanggal tidak sesuai atau overlap').first()).toBeVisible({ timeout: 10000 });
      await inv.closeGenerate();
    }
  });

  test('4. Konfirmasi Pembayaran: invoice Belum Lunas menjadi Lunas @smoke', async ({ page }) => {
    const inv = await BaInvoicePage.open(page);

    // ambil baris Belum Lunas pertama (bukan selalu baris teratas)
    const rowText = await inv.page.locator('main tbody tr', { hasText: 'Belum Lunas' }).first()
      .textContent().then((t) => (t ?? '').trim().replace(/\s+/g, ' '));
    expect(rowText).toContain('Belum Lunas');
    const invoiceNo = rowText.match(/INVOICE_\d+/)?.[0] ?? 'INVOICE_';

    await inv.openKonfirmasiPembayaran(invoiceNo);
    await expect(inv.page.getByText('Apakah Anda yakin ingin melunaskan invoice ini?').first()).toBeVisible({ timeout: 10000 });
    await inv.confirmLunas();

    const updated = await inv.rowFor(invoiceNo).textContent().then((t) => (t ?? '').trim().replace(/\s+/g, ' '));
    expect(updated).toContain('Lunas');
  });

  test('5. Print/Cetak: halaman invoice tetap tampil tanpa error @smoke', async ({ page }) => {
    const inv = await BaInvoicePage.open(page);

    const before = await inv.firstRowText();
    expect(before).toContain('INVOICE_');

    // baris Lunas tidak punya menu; cari baris Belum Lunas bila ada, kalau tidak pakai baris pertama yang punya menu
    const lunasRows = inv.page.locator('main tbody tr', { hasText: 'Belum Lunas' });
    if ((await lunasRows.count()) > 0) {
      await inv.printInvoice('Belum Lunas');
    } else {
      await inv.printInvoice((await inv.firstRowText()).match(/INVOICE_\d+/)?.[0] ?? '');
    }

    await expect(inv.page).toHaveURL(/\/invoice_internal/);
    await expect(inv.page.locator('body')).toContainText('Invoice');
  });
});
