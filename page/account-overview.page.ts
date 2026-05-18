import { Page, expect } from '@playwright/test';
import { Logger } from '../utils/logger';
import { OverviewLocators } from '../locators/overview.locator';

export class AccountOverviewPage {
  constructor(public readonly page: Page) {}


  async navigate(): Promise<void> {
    Logger.info('AccountOverviewPage: Clicking "Accounts Overview" nav link');
    await this.page.getByRole('link', { name: 'Accounts Overview' }).click();
    await expect(this.page).toHaveURL(/.*overview\.htm.*/, { timeout: 10000 });
    await this.page.locator(OverviewLocators.accountLink).first().waitFor({ state: 'visible', timeout: 20000 });
  }

  async getPrimaryAccountId(): Promise<string> {
    const firstAccountLink = this.page.locator(OverviewLocators.accountLink).first();
    await firstAccountLink.waitFor({ state: 'visible', timeout: 10000 });
    const accountId = (await firstAccountLink.innerText()).trim();
    Logger.info(`AccountOverviewPage: Primary account captured: #${accountId}`);
    return accountId;
  }

  async getAllAccountIds(): Promise<string[]> {
    const links = this.page.locator(OverviewLocators.accountLink);
    await links.first().waitFor({ state: 'visible', timeout: 10000 });
    const ids = await links.allInnerTexts();
    return ids.map(s => s.trim());
  }

  
  async getBalanceForAccount(accountId: string): Promise<number> {
    const row = this.page.locator(OverviewLocators.accountRows).filter({has: this.page.locator(`a:text-is("${accountId}")`)});
    await row.first().waitFor({ state: 'visible', timeout: 10000 });

    const balanceText = await row.first().locator('td').nth(1).innerText();
    const numeric = parseFloat(balanceText.replace(/[$,\s]/g, ''));

    if (isNaN(numeric)) {
      throw new Error(
        `AccountOverviewPage: Could not parse balance "${balanceText}" for #${accountId}`
      );
    }
    Logger.info(`AccountOverviewPage: UI balance #${accountId} = $${numeric.toFixed(2)}`);
    return numeric;
  }


  async getAllBalances(): Promise<Map<string, number>> {
    const rows = this.page.locator(OverviewLocators.accountRows);
    await rows.first().waitFor({ state: 'visible' });
    const count = await rows.count();
    const result = new Map<string, number>();

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const link = row.locator('td a').first();
      if (await link.count() === 0) continue;

      const accountId = (await link.innerText()).trim();
      const balanceText = await row.locator('td').nth(1).innerText();
      const balance = parseFloat(balanceText.replace(/[$,\s]/g, ''));
      if (!isNaN(balance)) result.set(accountId, balance);
    }
    return result;
  }
}


