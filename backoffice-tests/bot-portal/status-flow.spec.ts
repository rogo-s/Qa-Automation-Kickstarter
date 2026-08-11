import { test, expect } from '@playwright/test';
import { PortalMasterPage } from '../../shared/pages/PortalMasterPage';

test.describe.configure({ mode: 'serial', timeout: 240000 });

/**
 * Flow E2E Status Master Data Portal BOT (1x login via auth.setup.ts):
 * 1. Role QAPENTESTER: nonaktifkan lalu aktifkan kembali (via form Ubah / switch Status)
 * 2. User pentest@yopmail.com: nonaktifkan lalu aktifkan kembali (via menu Nonaktifkan/Aktifkan)
 * Data dipakai dari hasil add/edit flow (QAPENTESTER & pentest@yopmail.com sudah ada).
 */
test.describe('Portal BOT - Status Flow @regression', () => {
  test('1. Role QAPENTESTER: nonaktifkan lalu aktifkan lagi @smoke', async ({ page }) => {
    const portal = new PortalMasterPage(page);

    await portal.openRolePage();
    await expect(page.getByRole('cell', { name: 'QAPENTESTER', exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('row', { name: /QAPENTESTER/ })).toContainText('Aktif', { timeout: 10000 });

    // nonaktifkan
    await portal.setRoleStatus('QAPENTESTER', false);
    await portal.search('QAPENTESTER');
    await expect(page.getByRole('row', { name: /QAPENTESTER/ })).toContainText('Tidak Aktif', { timeout: 15000 });

    // aktifkan kembali
    await portal.setRoleStatus('QAPENTESTER', true);
    await portal.search('QAPENTESTER');
    await expect(page.getByRole('row', { name: /QAPENTESTER/ })).toContainText('Aktif', { timeout: 15000 });
  });

  test('2. User pentest@yopmail.com: nonaktifkan lalu aktifkan lagi @smoke', async ({ page }) => {
    const portal = new PortalMasterPage(page);

    await portal.openUserPage();
    await expect(page.getByRole('cell', { name: 'pentest@yopmail.com' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('row', { name: /pentest@yopmail.com/ })).toContainText('Aktif', { timeout: 10000 });

    // nonaktifkan
    await portal.deactivateUser('pentest@yopmail.com');
    await portal.search('pentest@yopmail.com');
    await expect(page.getByRole('row', { name: /pentest@yopmail.com/ })).toContainText('Tidak Aktif', { timeout: 15000 });

    // aktifkan kembali
    await portal.activateUser('pentest@yopmail.com');
    await portal.search('pentest@yopmail.com');
    await expect(page.getByRole('row', { name: /pentest@yopmail.com/ })).toContainText('Aktif', { timeout: 15000 });
  });
});