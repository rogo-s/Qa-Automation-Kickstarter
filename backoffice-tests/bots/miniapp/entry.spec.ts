import { test, expect } from '@playwright/test';
import { BotSelectorPage } from '../../../shared/pages/BotSelectorPage';

/**
 * MINIAPP - Entry (skeleton, lahir dari split per-BOT).
 * Tambahkan test case khas BOT Miniapp di file ini/folder ini.
 */
test.describe.configure({ mode: 'serial' });

test.describe('BOT MINIAPP - Entry @regression', () => {
  test('Dashboard menampilkan kartu BOT Miniapp @smoke', async ({ page }) => {
    const selector = new BotSelectorPage(page);
    await selector.goto();
    await expect(selector.heading).toBeVisible({ timeout: 15000 });
    await expect(selector.botCard('BOT Miniapp')).toBeVisible({ timeout: 15000 });
    await expect(selector.botCode('BOT Miniapp')).toHaveText('MINIAPP');
    await expect(selector.botName('BOT Miniapp')).toHaveText('BOT Miniapp');
  });
});