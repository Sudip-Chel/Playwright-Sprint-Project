import { test, expect } from '../../fixtures/apiFixture';
import uiData from '../../test-data/ui-transferData.json';
import { TransferLocators } from '../../locators/transferLocator';
import { Logger } from '../../utils/logger';

interface UiTestData {
  testCaseId: string;
  scenario: string;
  amount: string;
  isDefect: boolean;
  defectId?: string;
  isSameAccount?: boolean;
  tags: string[];
}

/** Pull a test case row from the JSON data file by ID. */
const dataFor = (id: string): UiTestData => {
  const row = (uiData as UiTestData[]).find(d => d.testCaseId === id);
  if (!row) throw new Error(`Test data row not found for ${id}`);
  return row;
};

test.describe('UI Transfer Validations @ui', () => {

  test('TC-UI-01: Successful fund transfer between own accounts @smoke @FR-05',
    async ({ transferPage, activeUser }) => {
    const data = dataFor('TC-UI-01');
    test.info().annotations.push({ type: 'Test Type', description: 'UI' });
    test.info().annotations.push({ type: 'Requirement', description: 'FR-05' });

    await transferPage.navigate();
    await transferPage.performTransfer(data.amount, activeUser.account1, activeUser.account2);
    await transferPage.verifySuccess(data.amount, activeUser.account1, activeUser.account2);
  });

  test('TC-UI-02: Confirmation displays formatted amount and account numbers @smoke @FR-08',
    async ({ transferPage, activeUser }) => {
    const data = dataFor('TC-UI-02');
    test.info().annotations.push({ type: 'Test Type', description: 'UI' });
    test.info().annotations.push({ type: 'Requirement', description: 'FR-08' });

    await transferPage.navigate();
    await transferPage.performTransfer(data.amount, activeUser.account1, activeUser.account2);
    await transferPage.verifySuccess(data.amount, activeUser.account1, activeUser.account2);

    const confirmationText = await transferPage.getConfirmationText();
    const formattedAmount = parseFloat(data.amount).toFixed(2);

    expect(confirmationText, 'FR-08: Should contain formatted amount').toContain(`$${formattedAmount}`);
    expect(confirmationText, 'FR-08: Should reference source account').toContain(activeUser.account1);
    expect(confirmationText, 'FR-08: Should reference target account').toContain(activeUser.account2);
  });

  
  test('TC-UI-03: Minimum boundary transfer ($0.01) succeeds via UI @regression @FR-05',
    async ({ transferPage, activeUser }) => {
    const data = dataFor('TC-UI-03');
    test.info().annotations.push({ type: 'Test Type', description: 'UI' });
    test.info().annotations.push({ type: 'Requirement', description: 'FR-05' });

    await transferPage.navigate();
    await transferPage.performTransfer(data.amount, activeUser.account1, activeUser.account2);
    await transferPage.verifySuccess(data.amount, activeUser.account1, activeUser.account2);
  });

  test('TC-UI-04-A: Empty amount should be rejected by UI @defects @FR-09',
    async ({ transferPage, activeUser, page }) => {
    const data = dataFor('TC-UI-04-A');
    test.info().annotations.push({ type: 'Test Type', description: 'UI' });
    test.info().annotations.push({ type: 'Requirement', description: 'FR-09' });
    test.info().annotations.push({ type: 'Known Bug', description: data.defectId! });

    await transferPage.navigate();
    await transferPage.performTransfer(data.amount, activeUser.account1, activeUser.account2);

    const successVisible = await page.locator(TransferLocators.successMessageBody)
      .isVisible({ timeout: 5000 }).catch(() => false);

    expect.soft(successVisible,
      `${data.defectId} active: UI Rejected empty amount and rendered a error page.`
    ).toBeFalsy();
  });

  test('TC-UI-04-B: Zero amount transfer accepted by UI (DEF-002) @defects @FR-09',
    async ({ transferPage, activeUser, page }) => {
    const data = dataFor('TC-UI-04-B');
    test.info().annotations.push({ type: 'Test Type', description: 'UI' });
    test.info().annotations.push({ type: 'Requirement', description: 'FR-09' });
    test.info().annotations.push({ type: 'Known Bug', description: 'DEF-002' });

    await transferPage.navigate();
    await transferPage.performTransfer(data.amount, activeUser.account1, activeUser.account2);

    const successVisible = await page.locator(TransferLocators.successMessageBody)
      .isVisible({ timeout: 5000 }).catch(() => false);

    expect.soft(successVisible,
      `DEF-002 active: UI accepted $0 transfer and rendered success page.`
    ).toBeTruthy();
  });

  test('TC-UI-04-C: Negative amount transfer accepted by UI (DEF-003) @defects @FR-09',
    async ({ transferPage, activeUser, page }) => {
    const data = dataFor('TC-UI-04-C');
    test.info().annotations.push({ type: 'Test Type', description: 'UI' });
    test.info().annotations.push({ type: 'Requirement', description: 'FR-09' });
    test.info().annotations.push({ type: 'Known Bug', description: 'DEF-003' });

    await transferPage.navigate();
    await transferPage.performTransfer(data.amount, activeUser.account1, activeUser.account2);

    const successVisible = await page.locator(TransferLocators.successMessageBody)
      .isVisible({ timeout: 5000 }).catch(() => false);

    expect.soft(successVisible,
      `DEF-003 active: UI accepted negative amount "${data.amount}" and rendered success page.`
    ).toBeTruthy();
  });

  test('TC-UI-05-A: Non-numeric "50#" partially accepted by UI (DEF-005) @defects @FR-09',
    async ({ transferPage, activeUser, page }) => {
    const data = dataFor('TC-UI-05-A');
    test.info().annotations.push({ type: 'Test Type', description: 'UI' });
    test.info().annotations.push({ type: 'Requirement', description: 'FR-09' });
    test.info().annotations.push({ type: 'Known Bug', description: 'DEF-005' });

    await transferPage.navigate();
    await transferPage.performTransfer(data.amount, activeUser.account1, activeUser.account2);

    const successVisible = await page.locator(TransferLocators.successMessageBody)
      .isVisible({ timeout: 5000 }).catch(() => false);

    expect.soft(successVisible,
      `DEF-005 active: UI accepted "${data.amount}" (parsed as 50, dropping "#").`
    ).toBeTruthy();
  });

  test('TC-UI-05-B: Non-numeric "abc" should be rejected by UI @defects @FR-09',
    async ({ transferPage, activeUser, page }) => {
    const data = dataFor('TC-UI-05-B');
    test.info().annotations.push({ type: 'Test Type', description: 'UI' });
    test.info().annotations.push({ type: 'Requirement', description: 'FR-09' });
    test.info().annotations.push({ type: 'Known Bug', description: data.defectId! });

    await transferPage.navigate();
    await transferPage.performTransfer(data.amount, activeUser.account1, activeUser.account2);

    
    const successVisible = await page.locator(TransferLocators.successMessageBody)
      .isVisible({ timeout: 5000 }).catch(() => false);

    expect.soft(successVisible,
      `${data.defectId}: ParaBank's handling of "abc" — success page rendered = ${successVisible}.`
    ).toBeFalsy();
  });


  test('TC-UI-06: Insufficient funds — overdraft incorrectly allowed (DEF-004) @defects @FR-09',
    async ({ transferPage, activeUser, page }) => {
    const data = dataFor('TC-UI-06');
    test.info().annotations.push({ type: 'Test Type', description: 'UI' });
    test.info().annotations.push({ type: 'Requirement', description: 'FR-09' });
    test.info().annotations.push({ type: 'Known Bug', description: 'DEF-004' });

    await transferPage.navigate();
    await transferPage.performTransfer(data.amount, activeUser.account1, activeUser.account2);

    const successVisible = await page.locator(TransferLocators.successMessageBody)
      .isVisible({ timeout: 5000 }).catch(() => false);

    expect.soft(successVisible,
      `DEF-004 active: UI accepted $${data.amount} transfer with insufficient funds.`
    ).toBeTruthy();
  });

  
  test('TC-UI-07: Same source and destination account allowed (DEF-001) @defects @FR-09',
    async ({ transferPage, activeUser, page }) => {
    const data = dataFor('TC-UI-07');
    test.info().annotations.push({ type: 'Test Type', description: 'UI' });
    test.info().annotations.push({ type: 'Requirement', description: 'FR-09' });
    test.info().annotations.push({ type: 'Known Bug', description: 'DEF-001' });

    await transferPage.navigate();
    await transferPage.performTransfer(data.amount, activeUser.account1, activeUser.account1);

    const successVisible = await page.locator(TransferLocators.successMessageBody)
      .isVisible({ timeout: 5000 }).catch(() => false);

    expect.soft(successVisible,
      `DEF-001 active: UI accepted transfer from #${activeUser.account1} to itself.`
    ).toBeTruthy();
  });

  test('TC-UI-08: Rapid clicks cause multiple debits despite single confirmation (DEF-006) @defects @FR-05 @FR-07',
    async ({ transferPage, accountOverviewPage, activeUser, page }) => {
    test.info().annotations.push({ type: 'Test Type', description: 'UI (Rapid-Click)' });
    test.info().annotations.push({ type: 'Requirement', description: 'FR-05, FR-07' });
    test.info().annotations.push({ type: 'Known Bug', description: 'DEF-006' });

    const TRANSFER_AMOUNT = 25;
    const CLICK_COUNT = 4;

    await accountOverviewPage.navigate();
    const preSource = await accountOverviewPage.getBalanceForAccount(activeUser.account1);
    const preTarget = await accountOverviewPage.getBalanceForAccount(activeUser.account2);
    Logger.info(`TC-UI-08: pre-balance (overview UI) source=$${preSource} target=$${preTarget}`);

    await transferPage.navigate();
    await transferPage.fillTransferForm(
      String(TRANSFER_AMOUNT),
      activeUser.account1,
      activeUser.account2
    );

    await transferPage.rapidClickTransfer(CLICK_COUNT);
    Logger.info(`TC-UI-08: ${CLICK_COUNT} rapid clicks dispatched`);

    await page.locator(TransferLocators.successMessageBody)
      .waitFor({ state: 'visible', timeout: 10000 });
    const confirmationText = await transferPage.getConfirmationText();
    Logger.info(`TC-UI-08: Transfer page confirmation: "${confirmationText.replace(/\s+/g, ' ').trim()}"`);

    expect(confirmationText, 'Transfer page should still show single transfer text')
      .toContain(`$${TRANSFER_AMOUNT.toFixed(2)}`);

   
    await accountOverviewPage.navigate();
    const postSource = await accountOverviewPage.getBalanceForAccount(activeUser.account1);
    const postTarget = await accountOverviewPage.getBalanceForAccount(activeUser.account2);
    Logger.info(`TC-UI-08: post-balance (overview UI) source=$${postSource} target=$${postTarget}`);

    const sourceDelta = preSource - postSource;
    const targetDelta = postTarget - preTarget;
    const observedDebitCount = Math.round(sourceDelta / TRANSFER_AMOUNT);
    Logger.info(
      `TC-UI-08: UI delta — source=$${sourceDelta.toFixed(2)} target=$${targetDelta.toFixed(2)} ` +
      `(${observedDebitCount} debits observed)`
    );


    expect.soft(observedDebitCount,
      `DEF-006 active: Transfer page confirmed ONE $${TRANSFER_AMOUNT} transfer, ` +
      `but overview shows ${observedDebitCount} debits totaling $${sourceDelta.toFixed(2)}. ` +
      `Source #${activeUser.account1}: $${preSource} → $${postSource}.`
    ).toBeGreaterThan(1);

    expect.soft(targetDelta,
      `DEF-006 active: Target #${activeUser.account2} credited multiple times. ` +
      `Expected $${TRANSFER_AMOUNT} delta, observed $${targetDelta.toFixed(2)}.`
    ).toBeGreaterThan(TRANSFER_AMOUNT);

    Logger.info(
      `TC-UI-08 verdict: Transfer UI claimed 1 transfer; overview UI reveals ${observedDebitCount}. ` +
      `DEF-006 ${observedDebitCount > 1 ? 'CONFIRMED ACTIVE' : 'appears FIXED'}.`
    );
  });
});