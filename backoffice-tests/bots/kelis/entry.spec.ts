import { test, expect } from '@playwright/test';
import { BotSelectorPage } from '../../../shared/pages/BotSelectorPage';

/**
 * KELIS - Entry (skeleton, lahir dari split per-BOT).
 * Tambahkan test case khas BOT Kelistrikan di file ini/folder ini.
 */
test.describe.configure({ mode: 'serial' });

test.describe('BOT KELIS - Entry @regression', () => {
  test('Dashboard menampilkan kartu BOT Kelistrikan @smoke', async ({ page }) => {
    const selector = new BotSelectorPage(page);
    await selector.goto();
    await expect(selector.heading).toBeVisible({ timeout: 15000 });
    await expect(selector.botByCode('KELIS')).toBeVisible({ timeout: 15000 });
    await expect(selector.botByCode('KELIS').locator('h3')).toHaveText('KELIS');
    await expect(selector.botByCode('KELIS').locator('p')).toHaveText('Kelistrikan');
  });
});