import { test, expect } from '@playwright/test';
import { BotSelectorPage } from '../../../shared/pages/BotSelectorPage';

/**
 * BA - Entry (skeleton, lahir dari split per-BOT).
 * Tambahkan test case khas BOT Biller Aggregator di file ini/folder ini.
 */
test.describe.configure({ mode: 'serial' });

test.describe('BOT BA - Entry @regression', () => {
  test('Dashboard menampilkan kartu BOT Biller Aggregator @smoke', async ({ page }) => {
    const selector = new BotSelectorPage(page);
    await selector.goto();
    await expect(selector.heading).toBeVisible({ timeout: 15000 });
    await expect(selector.botCard('Biller Aggregator')).toBeVisible({ timeout: 15000 });
    await expect(selector.botCode('Biller Aggregator')).toHaveText('BA');
    await expect(selector.botName('Biller Aggregator')).toHaveText('Biller Aggregator');
  });
});