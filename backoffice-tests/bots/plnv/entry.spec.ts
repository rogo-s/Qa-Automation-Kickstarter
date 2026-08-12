import { test, expect } from '@playwright/test';
import { BotSelectorPage } from '../../../shared/pages/BotSelectorPage';

/**
 * PLNV - Entry (skeleton, lahir dari split per-BOT).
 * Tambahkan test case khas BOT PLN Voucher di file ini/folder ini.
 */
test.describe.configure({ mode: 'serial' });

test.describe('BOT PLNV - Entry @regression', () => {
  test('Dashboard menampilkan kartu BOT PLN VOUCHER @smoke', async ({ page }) => {
    const selector = new BotSelectorPage(page);
    await selector.goto();
    await expect(selector.heading).toBeVisible({ timeout: 15000 });
    await expect(selector.botCard('PLN VOUCHER')).toBeVisible({ timeout: 15000 });
    await expect(selector.botCode('PLN VOUCHER')).toHaveText('PLNV');
    await expect(selector.botName('PLN VOUCHER')).toHaveText('PLN VOUCHER');
  });
});