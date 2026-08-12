import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model - BOT Selector (Portal Back Office)
 * Halaman "Pilih BOT Anda" menampilkan kartu per BOT, masing-masing
 * dengan tombol "Masuk" yang membuka webview BOT di tab baru.
 */
export class BotSelectorPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly botCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByText('Pilih BOT Anda');
    this.botCards = page.locator('div.p-4.border.rounded-lg');
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
  }

  botCard(name: string): Locator {
    return this.botCards.filter({ hasText: name }).first();
  }

  botByCode(code: string): Locator {
    return this.botCards.filter({ has: this.page.locator('h3', { hasText: code }) }).first();
  }

  botCode(name: string): Locator {
    return this.botCard(name).locator('h3');
  }

  botName(name: string): Locator {
    return this.botCard(name).locator('p');
  }

  async enterBot(name: string): Promise<Page> {
    const popupPromise = this.page.waitForEvent('popup');
    await this.botCard(name).getByRole('button', { name: 'Masuk' }).click();
    return popupPromise;
  }
}
