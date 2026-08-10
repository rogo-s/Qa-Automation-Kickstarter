import { test, expect } from '@playwright/test';
import { InfiniteScrollPage } from '../../shared/pages/InfiniteScrollPage';
import backofficeData from '../../shared/test-data/backoffice.json';

/**
 * Studi kasus: Back Office - Infinite Scroll
 * Target: the-internet.herokuapp.com
 * Data test: shared/test-data/backoffice.json (infinite_scroll)
 */

const infiniteScroll = backofficeData.infinite_scroll;

test.describe('Back Office - Infinite Scroll @regression', () => {
  test('Scroll ke bawah harus menambah item @smoke', async ({ page }) => {
    const infiniteScrollPage = new InfiniteScrollPage(page);
    await infiniteScrollPage.goto();

    const initial = await infiniteScrollPage.addedItems.count();
    await infiniteScrollPage.scrollToBottom();
    await expect
      .poll(async () => infiniteScrollPage.addedItems.count())
      .toBeGreaterThan(initial);
  });
});
