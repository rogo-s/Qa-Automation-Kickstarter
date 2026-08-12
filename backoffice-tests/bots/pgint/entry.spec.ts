import { test, expect } from '@playwright/test';
import { BotSelectorPage } from '../../../shared/pages/BotSelectorPage';

/**
 * PGINT - Entry (skeleton, lahir dari split per-BOT).
 * Tambahkan test case khas BOT Payment Gateway di file ini/folder ini.
 */
test.describe.configure({ mode: 'serial' });

test.describe('BOT PGINT - Entry @regression', () => {
  test('Dashboard menampilkan kartu BOT Payment Gateway @smoke', async ({ page }) => {
    const selector = new BotSelectorPage(page);
    await selector.goto();
    await expect(selector.heading).toBeVisible({ timeout: 15000 });
    await expect(selector.botCard('Payment Gateway')).toBeVisible({ timeout: 15000 });
    await expect(selector.botCode('Payment Gateway')).toHaveText('PGINT');
    await expect(selector.botName('Payment Gateway')).toHaveText('Payment Gateway');
  });
});