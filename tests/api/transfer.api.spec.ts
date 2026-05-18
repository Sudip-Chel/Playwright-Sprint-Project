import { test, expect } from '../../fixtures/api-fixture';
import apiData from '../../test-data/api-transfer.data.json';
import { Logger } from '../../utils/logger';

interface ApiTestData {
  testCaseId: string;
  scenario: string;
  amount: string;
  expectedStatus: number;
  isDefect: boolean;
  defectId?: string;
  isSameAccount?: boolean;
  validateBalance?: boolean;
  validateHistory?: boolean;
  tags: string[];
}

const dataFor = (id: string): ApiTestData => {
  const row = (apiData as ApiTestData[]).find(d => d.testCaseId === id);
  if (!row) throw new Error(`Test data row not found for ${id}`);
  return row;
};

test.describe('API Transfer Validations @api', () => {


  test('TC-API-01: Valid POST /transfer returns HTTP 200 @smoke @FR-05 @FR-06',
    async ({ apiClient, activeUser }) => {
    const data = dataFor('TC-API-01');
    test.info().annotations.push({ type: 'Test Type', description: 'API' });
    test.info().annotations.push({ type: 'Requirement', description: 'FR-05, FR-06' });

    const result = await apiClient.transfer(
      activeUser.account1,
      activeUser.account2,
      data.amount
    );

    expect(result.status, `Expected HTTP 200, got ${result.status}`).toBe(200);
    expect(result.body, 'Response body should contain success indicator')
      .toContain('Successfully transferred');
  });


  test('TC-API-02: Source debited and destination credited with exact deltas @regression @FR-06',
    async ({ apiClient, activeUser }) => {
    const data = dataFor('TC-API-02');
    test.info().annotations.push({ type: 'Test Type', description: 'API' });
    test.info().annotations.push({ type: 'Requirement', description: 'FR-06' });

    const amt = parseFloat(data.amount);
    const preSource = await apiClient.getBalance(activeUser.account1);
    const preTarget = await apiClient.getBalance(activeUser.account2);
    Logger.info(`TC-API-02: pre-balance source=$${preSource} target=$${preTarget}`);

    const result = await apiClient.transfer(
      activeUser.account1,
      activeUser.account2,
      data.amount
    );
    expect(result.status).toBe(200);

    const postSource = await apiClient.getBalance(activeUser.account1);
    const postTarget = await apiClient.getBalance(activeUser.account2);
    Logger.info(`TC-API-02: post-balance source=$${postSource} target=$${postTarget}`);

    expect(postSource,
      `FR-06: Source #${activeUser.account1} should be debited by $${amt} ` +
      `(pre=$${preSource}, post=$${postSource})`
    ).toBeCloseTo(preSource - amt, 2);

    expect(postTarget,
      `FR-06: Target #${activeUser.account2} should be credited by $${amt} ` +
      `(pre=$${preTarget}, post=$${postTarget})`
    ).toBeCloseTo(preTarget + amt, 2);
  });


  test('TC-API-03: Transaction history shows Debit on source and Credit on destination @regression @FR-07',
    async ({ apiClient, activeUser }) => {
    const data = dataFor('TC-API-03');
    test.info().annotations.push({ type: 'Test Type', description: 'API' });
    test.info().annotations.push({ type: 'Requirement', description: 'FR-07' });

    const amt = parseFloat(data.amount);
    const result = await apiClient.transfer(
      activeUser.account1,
      activeUser.account2,
      data.amount
    );
    expect(result.status).toBe(200);

    const sourceTxns = await apiClient.getTransactions(activeUser.account1);
    const targetTxns = await apiClient.getTransactions(activeUser.account2);

    expect(sourceTxns.length, `Source #${activeUser.account1} should have history entries`)
      .toBeGreaterThan(0);

    const debit = sourceTxns.find(tx =>
      tx.type === 'Debit' && Math.abs(parseFloat(String(tx.amount))) === amt
    );
    const credit = targetTxns.find(tx =>
      tx.type === 'Credit' && Math.abs(parseFloat(String(tx.amount))) === amt
    );

    expect(debit,
      `FR-07: Source #${activeUser.account1} should contain Debit of $${amt}. ` +
      `Found types: ${sourceTxns.map(t => t.type).join(', ')}`
    ).toBeDefined();

    expect(credit,
      `FR-07: Target #${activeUser.account2} should contain Credit of $${amt}. ` +
      `Found types: ${targetTxns.map(t => t.type).join(', ')}`
    ).toBeDefined();

    Logger.info(`TC-API-03: history verified — Debit on #${activeUser.account1}, Credit on #${activeUser.account2}`);
  });

  test('TC-API-04: Insufficient funds — API incorrectly returns 200 (DEF-004) @defects @FR-09',
    async ({ apiClient, activeUser }) => {
    const data = dataFor('TC-API-04');
    test.info().annotations.push({ type: 'Test Type', description: 'API' });
    test.info().annotations.push({ type: 'Requirement', description: 'FR-09' });
    test.info().annotations.push({ type: 'Known Bug', description: 'DEF-004' });

    const result = await apiClient.transfer(
      activeUser.account1,
      activeUser.account2,
      data.amount
    );
    Logger.info(`TC-API-04: POST /transfer($${data.amount}) → HTTP ${result.status}`);

  
    expect.soft(result.status,
      `DEF-004 active: API returned 200 for $${data.amount} overdraft transfer ` +
      `(should be 4xx). If this assertion fails, the bug may be fixed — update test.`
    ).toBe(200);
  });


  test('TC-API-05-A: Negative amount transfer accepted by API (DEF-003) @defects @FR-09',
    async ({ apiClient, activeUser }) => {
    const data = dataFor('TC-API-05-A');
    test.info().annotations.push({ type: 'Test Type', description: 'API' });
    test.info().annotations.push({ type: 'Requirement', description: 'FR-09' });
    test.info().annotations.push({ type: 'Known Bug', description: 'DEF-003' });

    const result = await apiClient.transfer(
      activeUser.account1,
      activeUser.account2,
      data.amount
    );
    Logger.info(`TC-API-05-A: POST /transfer($${data.amount}) → HTTP ${result.status}`);

    expect.soft(result.status,
      `DEF-003 active: API returned 200 for negative amount "${data.amount}" ` +
      `(should be 4xx). If this assertion fails, bug may be fixed — update test.`
    ).toBe(200);
  });

  test('TC-API-05-B: Same-account (from=to) transfer accepted by API (DEF-001) @defects @FR-09',
    async ({ apiClient, activeUser }) => {
    const data = dataFor('TC-API-05-B');
    test.info().annotations.push({ type: 'Test Type', description: 'API' });
    test.info().annotations.push({ type: 'Requirement', description: 'FR-09' });
    test.info().annotations.push({ type: 'Known Bug', description: 'DEF-001' });

    const result = await apiClient.transfer(
      activeUser.account1,
      activeUser.account1, // same account intentionally
      data.amount
    );
    Logger.info(`TC-API-05-B: POST /transfer same-account → HTTP ${result.status}`);

    expect.soft(result.status,
      `DEF-001 active: API accepted same-account transfer ($${data.amount} from ` +
      `#${activeUser.account1} to itself). If this fails, bug may be fixed.`
    ).toBe(200);
  });
});