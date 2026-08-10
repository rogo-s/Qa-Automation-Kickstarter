import { test, expect } from '@playwright/test';
import { NotificationMessagePage } from '../../shared/pages/NotificationMessagePage';
import backofficeData from '../../shared/test-data/backoffice.json';

/**
 * Studi kasus: Back Office - Notification Message
 * Target: the-internet.herokuapp.com
 * Data test: shared/test-data/backoffice.json (notification)
 * Catatan: pesan yang muncul acak (success/unsuccessful), test menerima keduanya.
 */

const notification = backofficeData.notification;

test.describe('Back Office - Notification Message @regression', () => {
  test('Mengklik link harus memuat pesan notifikasi @smoke', async ({ page }) => {
    const notificationPage = new NotificationMessagePage(page);
    await notificationPage.goto();

    await notificationPage.clickHere();
    await expect(notificationPage.flash).toBeVisible();
  });

  test('Pesan notifikasi harus berisi teks yang dikenal @smoke', async ({ page }) => {
    const notificationPage = new NotificationMessagePage(page);
    await notificationPage.goto();

    await notificationPage.clickHere();
    const text = await notificationPage.flash.innerText();
    const isKnown = text.includes(notification.success) || text.includes(notification.unsuccessful);
    expect(isKnown).toBe(true);
  });

  test('Tombol close harus menyembunyikan pesan', async ({ page }) => {
    const notificationPage = new NotificationMessagePage(page);
    await notificationPage.goto();

    await notificationPage.clickHere();
    await expect(notificationPage.flash).toBeVisible();
    await page.locator('#flash .close').click();
    await expect(notificationPage.flash).toBeHidden();
  });
});
