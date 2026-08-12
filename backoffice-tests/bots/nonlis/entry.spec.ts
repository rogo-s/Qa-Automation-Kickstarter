import { test, expect } from '@playwright/test';
import { BotSelectorPage } from '../../../shared/pages/BotSelectorPage';

/**
 * NONLIS - Entry (skeleton, lahir dari split per-BOT).
 * Tambahkan test case khas BOT Non Kelistrikan di file ini/folder ini.
 */
test.describe.configure({ mode: 'serial' });

test.describe('BOT NONLIS - Entry @regression', () => {
  test('Dashboard menampilkan kartu BOT Non Kelistrikan @smoke', async ({ page }) => {
    const selector = new BotSelectorPage(page);
    await selector.goto();
    await expect(selector.heading).toBeVisible({ timeout: 15000 });
    await expect(selector.botCard('Non Kelistrikan')).toBeVisible({ timeout: 15000 });
    await expect(selector.botCode('Non Kelistrikan')).toHaveText('NONLIS');
    await expect(selector.botName('Non Kelistrikan')).toHaveText('Non Kelistrikan');
  });
});