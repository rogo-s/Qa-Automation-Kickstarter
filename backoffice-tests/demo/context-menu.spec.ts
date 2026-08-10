import { test, expect } from '@playwright/test';
import { ContextMenuPage } from '../../shared/pages/ContextMenuPage';
import backofficeData from '../../shared/test-data/backoffice.json';

/**
 * Studi kasus: Back Office - Context Menu
 * Target: the-internet.herokuapp.com
 * Data test: shared/test-data/backoffice.json (context_menu)
 */

const contextMenu = backofficeData.context_menu;

test.describe('Back Office - Context Menu @regression', () => {
  test('Klik kanan pada hotspot menampilkan alert @smoke', async ({ page }) => {
    const contextMenuPage = new ContextMenuPage(page);
    await contextMenuPage.goto();

    let message = '';
    page.once('dialog', async (dialog) => {
      message = dialog.message();
      await dialog.accept();
    });

    await contextMenuPage.rightClick();
    expect(message).toBe(contextMenu.alert_text);
  });
});
