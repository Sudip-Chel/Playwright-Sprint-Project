import { Page, expect } from '@playwright/test';
import { Logger } from '../utils/logger';
import { OverviewLocators } from '../locators/overviewLocator';

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

}


