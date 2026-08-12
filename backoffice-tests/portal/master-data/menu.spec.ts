import { test, expect } from '@playwright/test';
import { PortalMasterPage } from '../../../shared/pages/PortalMasterPage';

test.describe.configure({ mode: 'serial' });

/**
 * Menu Menu - Portal BOT (1x login via auth.setup.ts):
 * 1. Verifikasi form tambah menu menampilkan semua field
 */
test.describe('Portal BOT - Menu Menu @regression', () => {
  test('1. Menu: form tambah menu menampilkan semua field @smoke', async ({ page }) => {
    const portal = new PortalMasterPage(page);
    await portal.openMenuPage();
    await portal.openAddMenuForm();

    await expect(page.getByPlaceholder('Masukan nama menu')).toBeVisible();
    await expect(page.getByPlaceholder('Masukan kode')).toBeVisible();
    await expect(page.getByText('Tidak ada parent')).toBeVisible();
    await expect(page.getByPlaceholder('Masukan deskripsi')).toBeVisible();
    await expect(page.getByRole('switch')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Simpan' })).toBeVisible();
  });
});
