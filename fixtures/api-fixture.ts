import { test as baseTest } from './base-fixture';
import { APIRequestContext, APIResponse } from '@playwright/test';
import { ApiLogger, Logger } from '../utils/logger';

export interface Transaction {
  id: number;
  accountId: number;
  type: 'Debit' | 'Credit';
  amount: number | string;
  description?: string;
  date?: string;
}

export interface TransferResult {
  status: number;
  body: string;
  ok: boolean;
}

export interface Account {
  id: number;
  customerId?: number;
  type?: string;
  balance: number;
}

export interface ApiClient {
  getBalance(accountId: string): Promise<number>;

  getTransactions(accountId: string): Promise<Transaction[]>;

  transfer(from: string, to: string, amount: string): Promise<TransferResult>;

  getAccount(accountId: string): Promise<Account>;

  readonly raw: APIRequestContext;
}

type ApiFixtures = {
  apiClient: ApiClient;
};

async function withRetry<T>(
  fn: () => Promise<APIResponse>,
  label: string,
  maxAttempts = 2
): Promise<APIResponse> {
  let lastErr: Error | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fn();
      if (res.status() >= 500 && attempt < maxAttempts) {
        Logger.warn(`apiClient: ${label} returned ${res.status()}, retry ${attempt}/${maxAttempts}`);
        await new Promise(r => setTimeout(r, 800 * attempt));
        continue;
      }
      return res;
    } catch (e) {
      lastErr = e as Error;
      if (attempt < maxAttempts) {
        Logger.warn(`apiClient: ${label} threw "${lastErr.message}", retry ${attempt}/${maxAttempts}`);
        await new Promise(r => setTimeout(r, 800 * attempt));
      }
    }
  }
  throw lastErr ?? new Error(`apiClient: ${label} failed after ${maxAttempts} attempts`);
}

export const test = baseTest.extend<ApiFixtures>({

  apiClient: async ({ page }, use) => {
    const ctx: APIRequestContext = page.request;

    const client: ApiClient = {
      raw: ctx,

      async getBalance(accountId: string): Promise<number> {
        const res = await withRetry(
          () => ctx.get(`/parabank/services/bank/accounts/${accountId}`, {
            headers: { 'Accept': 'application/json' }
          }),
          `GET /accounts/${accountId}`
        );
        if (res.status() !== 200) {
          throw new Error(`apiClient.getBalance(${accountId}) -> HTTP ${res.status()}`);
        }
        const data = await res.json();
        const balance = parseFloat(data.balance);
        ApiLogger.info({ op: 'getBalance', accountId, balance });
        return balance;
      },

      async getTransactions(accountId: string): Promise<Transaction[]> {
        const res = await withRetry(
          () => ctx.get(`/parabank/services/bank/accounts/${accountId}/transactions`, {
            headers: { 'Accept': 'application/json' }
          }),
          `GET /accounts/${accountId}/transactions`
        );
        if (res.status() !== 200) {
          throw new Error(`apiClient.getTransactions(${accountId}) -> HTTP ${res.status()}`);
        }
        const txns: Transaction[] = await res.json();
        ApiLogger.info({ op: 'getTransactions', accountId, count: txns.length });
        return txns;
      },

      async transfer(from: string, to: string, amount: string): Promise<TransferResult> {
        const res = await withRetry(
          () => ctx.post(`/parabank/services/bank/transfer`, {
            params: { fromAccountId: from, toAccountId: to, amount },
            headers: { 'Accept': 'application/json' }
          }),
          `POST /transfer`
        );
        const body = await res.text();
        const result: TransferResult = {
          status: res.status(),
          body,
          ok: res.status() === 200
        };
        ApiLogger.info({
          op: 'transfer',
          from,
          to,
          amount,
          status: result.status,
          ok: result.ok
        });
        return result;
      },

      async getAccount(accountId: string): Promise<Account> {
        const res = await withRetry(
          () => ctx.get(`/parabank/services/bank/accounts/${accountId}`, {
            headers: { 'Accept': 'application/json' }
          }),
          `GET /accounts/${accountId} (full)`
        );
        if (res.status() !== 200) {
          throw new Error(`apiClient.getAccount(${accountId}) -> HTTP ${res.status()}`);
        }
        return await res.json();
      }
    };

    await use(client);
  }
});

export { expect } from '@playwright/test';