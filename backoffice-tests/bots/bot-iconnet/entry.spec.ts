import { test, expect } from '@playwright/test';
import { BotSelectorPage } from '../../../shared/pages/BotSelectorPage';

/**
 * BOT ICONNET - Entry (skeleton, lahir dari split per-BOT).
 * Tambahkan test case khas BOT ICONNET di file ini/folder ini.
 */
test.describe.configure({ mode: 'serial' });

test.describe('BOT ICONNET - Entry @regression', () => {
  test('Dashboard menampilkan kartu BOT ICONNET @smoke', async ({ page }) => {
    const selector = new BotSelectorPage(page);
    await selector.goto();
    await expect(selector.heading).toBeVisible({ timeout: 15000 });
    await expect(selector.botCard('BOT ICONNET')).toBeVisible({ timeout: 15000 });
    await expect(selector.botCode('BOT ICONNET')).toHaveText('BOT_ICONNET');
    await expect(selector.botName('BOT ICONNET')).toHaveText('BOT ICONNET');
  });
});