import { test, expect } from '@playwright/test';
import { FileUploadPage } from '../../shared/pages/FileUploadPage';
import backofficeData from '../../shared/test-data/backoffice.json';

/**
 * Studi kasus: Back Office - File Upload
 * Target: the-internet.herokuapp.com
 * Data test: shared/test-data/backoffice.json (upload)
 */

const upload = backofficeData.upload;

test.describe('Back Office - File Upload @regression', () => {
  test('Halaman upload harus menampilkan form upload', async ({ page }) => {
    const uploadPage = new FileUploadPage(page);
    await uploadPage.goto();

    await expect(uploadPage.fileInput).toBeVisible();
    await expect(uploadPage.fileInput).toBeEnabled();
    await expect(uploadPage.submitButton).toBeVisible();
  });

  test('Upload file harus berhasil dan menampilkan nama file @smoke', async ({ page }) => {
    const uploadPage = new FileUploadPage(page);
    await uploadPage.goto();

    await uploadPage.uploadBuffer(upload.file_name, upload.file_content);
    await expect(uploadPage.uploadedFiles).toContainText(upload.file_name);
  });

  test('Upload file dengan nama lain harus menampilkan nama tersebut', async ({ page }) => {
    const uploadPage = new FileUploadPage(page);
    await uploadPage.goto();

    await uploadPage.uploadBuffer(upload.alt_file_name, upload.file_content);
    await expect(uploadPage.uploadedFiles).toContainText(upload.alt_file_name);
  });
});
