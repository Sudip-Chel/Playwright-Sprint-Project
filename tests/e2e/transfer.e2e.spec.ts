import { test, expect } from '../../fixtures/apiFixture';
import e2eData from '../../test-data/e2e-transferData.json';
import { Logger } from '../../utils/logger';

interface E2ETestData {
  testCaseId: string;
  scenario: string;
  amount?: string;
  amountArray?: string[];
  invalidAmounts?: string[];
  expectedCumulativeDeduction?: number;
  isDefect: boolean;
  defectId?: string;
  isSameAccount?: boolean;
  validateHistory?: boolean;
  verifyConfirmationText?: boolean;
  tags: string[];
}

const dataFor = (id: string): E2ETestData => {
  const row = (e2eData as E2ETestData[]).find(d => d.testCaseId === id);
  if (!row) throw new Error(`Test data row not found for ${id}`);
  return row;
};

test.describe('E2E Hybrid Transfer Validations @e2e', () => {


  test('TC-E2E-01: UI transfer + API balance + transaction history verification @smoke @FR-05 @FR-06 @FR-07',
    async ({ transferPage, apiClient, activeUser }) => {
    const data = dataFor('TC-E2E-01');
    test.info().annotations.push({ type: 'Test Type', description: 'E2E Hybrid' });
    test.info().annotations.push({ type: 'Requirement', description: 'FR-05, FR-06, FR-07' });

    const amt = parseFloat(data.amount!);
    const preSource = await apiClient.getBalance(activeUser.account1);
    const preTarget = await apiClient.getBalance(activeUser.account2);
    Logger.info(`TC-E2E-01: pre source=$${preSource} target=$${preTarget}`);

    await transferPage.navigate();
    await transferPage.performTransfer(data.amount!, activeUser.account1, activeUser.account2);
    await transferPage.verifySuccess(data.amount!, activeUser.account1, activeUser.account2);

    const postSource = await apiClient.getBalance(activeUser.account1);
    const postTarget = await apiClient.getBalance(activeUser.account2);
    Logger.info(`TC-E2E-01: post source=$${postSource} target=$${postTarget}`);

    expect(postSource, `FR-06: Source debited by $${amt}`).toBeCloseTo(preSource - amt, 2);
    expect(postTarget, `FR-06: Target credited by $${amt}`).toBeCloseTo(preTarget + amt, 2);

    const debit = await apiClient.getTransactions(activeUser.account1)
      .then(txns => txns.find(tx =>
        tx.type === 'Debit' && Math.abs(parseFloat(String(tx.amount))) === amt
      ));
    const credit = await apiClient.getTransactions(activeUser.account2)
      .then(txns => txns.find(tx =>
        tx.type === 'Credit' && Math.abs(parseFloat(String(tx.amount))) === amt
      ));
    expect(debit, `FR-07: Debit of $${amt} in source history`).toBeDefined();
    expect(credit, `FR-07: Credit of $${amt} in target history`).toBeDefined();
  });

  test('TC-E2E-02: UI confirmation text matches API success response @regression @FR-08',
    async ({ transferPage, apiClient, activeUser }) => {
    const data = dataFor('TC-E2E-02');
    test.info().annotations.push({ type: 'Test Type', description: 'E2E Hybrid' });
    test.info().annotations.push({ type: 'Requirement', description: 'FR-08' });

    const amt = parseFloat(data.amount!);
    const preSource = await apiClient.getBalance(activeUser.account1);

    await transferPage.navigate();
    await transferPage.performTransfer(data.amount!, activeUser.account1, activeUser.account2);
    await transferPage.verifySuccess(data.amount!, activeUser.account1, activeUser.account2);

    const confirmationText = await transferPage.getConfirmationText();
    const formattedAmount = parseFloat(data.amount!).toFixed(2);

    expect(confirmationText, 'FR-08: UI shows formatted amount').toContain(`$${formattedAmount}`);
    expect(confirmationText, 'FR-08: UI shows source account').toContain(activeUser.account1);
    expect(confirmationText, 'FR-08: UI shows target account').toContain(activeUser.account2);

    const postSource = await apiClient.getBalance(activeUser.account1);
    expect(postSource, 'API confirms UI-claimed debit').toBeCloseTo(preSource - amt, 2);
  });


  test('TC-E2E-03: Minimum boundary ($0.01) UI transfer + API balance verification @regression @FR-05 @FR-06',
    async ({ transferPage, apiClient, activeUser }) => {
    const data = dataFor('TC-E2E-03');
    test.info().annotations.push({ type: 'Test Type', description: 'E2E Hybrid' });
    test.info().annotations.push({ type: 'Requirement', description: 'FR-05, FR-06' });

    const amt = parseFloat(data.amount!);
    const preSource = await apiClient.getBalance(activeUser.account1);
    const preTarget = await apiClient.getBalance(activeUser.account2);

    await transferPage.navigate();
    await transferPage.performTransfer(data.amount!, activeUser.account1, activeUser.account2);
    await transferPage.verifySuccess(data.amount!, activeUser.account1, activeUser.account2);

    const postSource = await apiClient.getBalance(activeUser.account1);
    const postTarget = await apiClient.getBalance(activeUser.account2);

    expect(postSource, `FR-06: Source debited by $${amt}`).toBeCloseTo(preSource - amt, 2);
    expect(postTarget, `FR-06: Target credited by $${amt}`).toBeCloseTo(preTarget + amt, 2);
  });

  test('TC-E2E-04: Insufficient-funds UI + API state verification (DEF-004) @defects @FR-09',
    async ({ transferPage, apiClient, activeUser }) => {
    const data = dataFor('TC-E2E-04');
    test.info().annotations.push({ type: 'Test Type', description: 'E2E Hybrid' });
    test.info().annotations.push({ type: 'Requirement', description: 'FR-09' });
    test.info().annotations.push({ type: 'Known Bug', description: 'DEF-004' });

    const amt = parseFloat(data.amount!);
    const preSource = await apiClient.getBalance(activeUser.account1);
    Logger.info(`TC-E2E-04: pre source=$${preSource} (attempting overdraft of $${amt})`);

    await transferPage.navigate();
    await transferPage.performTransfer(data.amount!, activeUser.account1, activeUser.account2);

    const postSource = await apiClient.getBalance(activeUser.account1);
    Logger.info(`TC-E2E-04: post source=$${postSource}`);

    expect.soft(postSource,
      `DEF-004 active: Overdraft transfer of $${amt} was accepted — source went ` +
      `from $${preSource} to $${postSource}. Should have remained $${preSource}. ` +
      `If this assertion fails, the overdraft check may have been added — update test.`
    ).toBeCloseTo(preSource - amt, 2);
  });


  test('TC-E2E-05: Same-account transfer UI + API state verification (DEF-001) @defects @FR-09',
    async ({ transferPage, apiClient, activeUser }) => {
    const data = dataFor('TC-E2E-05');
    test.info().annotations.push({ type: 'Test Type', description: 'E2E Hybrid' });
    test.info().annotations.push({ type: 'Requirement', description: 'FR-09' });
    test.info().annotations.push({ type: 'Known Bug', description: 'DEF-001' });

    const amt = parseFloat(data.amount!);
    const preSource = await apiClient.getBalance(activeUser.account1);
    const preTxnCount = (await apiClient.getTransactions(activeUser.account1)).length;
    Logger.info(`TC-E2E-05: pre balance=$${preSource}, history count=${preTxnCount}`);

    await transferPage.navigate();
    await transferPage.performTransfer(data.amount!, activeUser.account1, activeUser.account1);

    const postSource = await apiClient.getBalance(activeUser.account1);
    const postTxnCount = (await apiClient.getTransactions(activeUser.account1)).length;
    const newTxns = postTxnCount - preTxnCount;
    Logger.info(`TC-E2E-05: post balance=$${postSource}, history count=${postTxnCount} (+${newTxns})`);

    expect.soft(postSource,
      `DEF-001 documented: Same-account net balance should be unchanged ($${preSource})`
    ).toBeCloseTo(preSource, 2);

    expect.soft(newTxns,
      `DEF-001 active: Same-account transfer created phantom Debit+Credit history entries ` +
      `(${newTxns} new entries since pre-state). If this fails, bug may be fixed.`
    ).toBeGreaterThan(0);
  });

  test('TC-E2E-06: Three consecutive UI transfers (10, 20, 30) — cumulative balance and history @regression @FR-06 @FR-07',
    async ({ transferPage, apiClient, activeUser }) => {
    const data = dataFor('TC-E2E-06');
    test.info().annotations.push({ type: 'Test Type', description: 'E2E Hybrid' });
    test.info().annotations.push({ type: 'Requirement', description: 'FR-06, FR-07' });

    const preSource = await apiClient.getBalance(activeUser.account1);
    const preTarget = await apiClient.getBalance(activeUser.account2);
    Logger.info(`TC-E2E-06: pre source=$${preSource} target=$${preTarget}`);

    for (const amt of data.amountArray!) {
      await transferPage.navigate();
      await transferPage.performTransfer(amt, activeUser.account1, activeUser.account2);
      await transferPage.verifySuccess(amt, activeUser.account1, activeUser.account2);
    }

    const postSource = await apiClient.getBalance(activeUser.account1);
    const postTarget = await apiClient.getBalance(activeUser.account2);
    Logger.info(`TC-E2E-06: post source=$${postSource} target=$${postTarget}`);

    const cumulative = data.expectedCumulativeDeduction!;
    expect(postSource,
      `FR-06: Cumulative deduction $${cumulative} (= ${data.amountArray!.join(' + ')})`
    ).toBeCloseTo(preSource - cumulative, 2);

    expect(postTarget,
      `FR-06: Cumulative credit $${cumulative}`
    ).toBeCloseTo(preTarget + cumulative, 2);

    const sourceTxns = await apiClient.getTransactions(activeUser.account1);
    const targetTxns = await apiClient.getTransactions(activeUser.account2);

    for (const amt of data.amountArray!) {
      const amount = parseFloat(amt);
      const debit = sourceTxns.find(tx =>
        tx.type === 'Debit' && Math.abs(parseFloat(String(tx.amount))) === amount
      );
      const credit = targetTxns.find(tx =>
        tx.type === 'Credit' && Math.abs(parseFloat(String(tx.amount))) === amount
      );
      expect(debit, `FR-07: Debit of $${amt} in source history`).toBeDefined();
      expect(credit, `FR-07: Credit of $${amt} in target history`).toBeDefined();
    }
  });

  
  test('TC-E2E-07: Invalid amounts cause balance drift (DEF-002+003+005) @defects @FR-09',
    async ({ transferPage, apiClient, activeUser, page }) => {
    const data = dataFor('TC-E2E-07');
    test.info().annotations.push({ type: 'Test Type', description: 'E2E Hybrid' });
    test.info().annotations.push({ type: 'Requirement', description: 'FR-09' });
    test.info().annotations.push({ type: 'Known Bug', description: data.defectId! });

    const preSource = await apiClient.getBalance(activeUser.account1);
    const preTarget = await apiClient.getBalance(activeUser.account2);
    Logger.info(`TC-E2E-07: pre source=$${preSource} target=$${preTarget}`);

    
    for (const invalidAmt of data.invalidAmounts!) {
      Logger.info(`TC-E2E-07: attempting invalid amount "${invalidAmt}"`);
      await transferPage.navigate();
      try {
        await transferPage.performTransfer(invalidAmt, activeUser.account1, activeUser.account2);
      } catch (e) {
        Logger.info(`TC-E2E-07: transfer threw (expected for some invalid inputs): ${(e as Error).message}`);
      }
      await page.waitForTimeout(1_200);
    }

    const postSource = await apiClient.getBalance(activeUser.account1);
    const postTarget = await apiClient.getBalance(activeUser.account2);
    const sourceDrift = Math.abs(preSource - postSource);
    const targetDrift = Math.abs(postTarget - preTarget);
    const totalDrift = sourceDrift + targetDrift;
    Logger.info(
      `TC-E2E-07: post source=$${postSource} (drift=$${sourceDrift.toFixed(2)}) ` +
      `target=$${postTarget} (drift=$${targetDrift.toFixed(2)}) total=$${totalDrift.toFixed(2)}`
    );


    expect.soft(totalDrift,
      `Defects ${data.defectId} active: Invalid inputs (${data.invalidAmounts!.join(', ')}) ` +
      `caused $${totalDrift.toFixed(2)} of total balance drift ` +
      `(source: $${preSource}→$${postSource}, target: $${preTarget}→$${postTarget}). ` +
      `If this fails, ParaBank may have added input validation — update test.`
    ).toBeGreaterThan(0);

    Logger.info(
      `TC-E2E-07 verdict: ${data.defectId} ` +
      `${totalDrift > 0 ? 'CONFIRMED ACTIVE' : 'appears FIXED — investigate'}.`
    );
  });

  test('TC-E2E-08: Full E2E — login → UI transfer → API balance + history verification @smoke @FR-05 @FR-06 @FR-07 @FR-08',
    async ({ transferPage, apiClient, activeUser }) => {
    const data = dataFor('TC-E2E-08');
    test.info().annotations.push({ type: 'Test Type', description: 'E2E Hybrid' });
    test.info().annotations.push({ type: 'Requirement', description: 'FR-05, FR-06, FR-07, FR-08' });

    const amt = parseFloat(data.amount!);
    const preSource = await apiClient.getBalance(activeUser.account1);
    const preTarget = await apiClient.getBalance(activeUser.account2);

    await transferPage.navigate();
    await transferPage.performTransfer(data.amount!, activeUser.account1, activeUser.account2);
    await transferPage.verifySuccess(data.amount!, activeUser.account1, activeUser.account2);

    
    const postSource = await apiClient.getBalance(activeUser.account1);
    const postTarget = await apiClient.getBalance(activeUser.account2);
    expect(postSource, `FR-06: Source debited by $${amt}`).toBeCloseTo(preSource - amt, 2);
    expect(postTarget, `FR-06: Target credited by $${amt}`).toBeCloseTo(preTarget + amt, 2);

  
    const debit = await apiClient.getTransactions(activeUser.account1)
      .then(txns => txns.find(tx =>
        tx.type === 'Debit' && Math.abs(parseFloat(String(tx.amount))) === amt
      ));
    const credit = await apiClient.getTransactions(activeUser.account2)
      .then(txns => txns.find(tx =>
        tx.type === 'Credit' && Math.abs(parseFloat(String(tx.amount))) === amt
      ));
    expect(debit, `FR-07: Debit of $${amt} in source history`).toBeDefined();
    expect(credit, `FR-07: Credit of $${amt} in target history`).toBeDefined();
  });
});

