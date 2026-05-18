import { test, expect } from '../../fixtures/base-fixture';
import { Logger } from '../../utils/logger';

test.describe('Performance Lite @perf', () => {

  test('TC-PERF-01: Transfer page TTI < 5000 ms', async ({ transferPage, page, activeUser }) => {
    test.info().annotations.push({
      type: 'Performance Threshold',
      description: 'TTI < 5000 ms'
    });

    const startTime = Date.now();
    await transferPage.navigate();
    const wallClockTime = Date.now() - startTime;

   const navigationTiming = await page.evaluate(() => {
  const t = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

  return {
    domContentLoaded: t.domContentLoadedEventEnd,
    loadComplete: t.loadEventEnd,
    domInteractive: t.domInteractive
  };
});

    Logger.info(
      `PERF-01: wallClock=${wallClockTime}ms ` +
      `timing=${JSON.stringify(navigationTiming)}`
    );

    expect.soft(wallClockTime,
      `Transfer page should load in under 5000 ms (actual: ${wallClockTime} ms)`
    ).toBeLessThan(5000);
  });

  test('TC-PERF-02: GET /accounts/{id} response < 2000 ms',
    async ({ activeUser, page }) => {
    test.info().annotations.push({
      type: 'Performance Threshold',
      description: 'API < 2000 ms'
    });

    const startTime = Date.now();
    const res = await page.request.get(
      `/parabank/services/bank/accounts/${activeUser.account1}`,
      { headers: { 'Accept': 'application/json' } }
    );
    const responseTime = Date.now() - startTime;
    Logger.info(
      `PERF-02: GET /accounts/${activeUser.account1} = ${responseTime}ms ` +
      `(HTTP ${res.status()})`
    );

    expect(res.status()).toBe(200);
    expect.soft(responseTime,
      `GET /accounts should return in under 2000 ms (actual: ${responseTime} ms)`
    ).toBeLessThan(2000);
  });

  test('TC-PERF-03: POST /transfer response < 3000 ms',
    async ({ activeUser, page }) => {
    test.info().annotations.push({
      type: 'Performance Threshold',
      description: 'API < 3000 ms'
    });

    const startTime = Date.now();
    const res = await page.request.post(`/parabank/services/bank/transfer`, {
      params: {
        fromAccountId: activeUser.account1,
        toAccountId: activeUser.account2,
        amount: '1'
      },
      headers: { 'Accept': 'application/json' }
    });
    const responseTime = Date.now() - startTime;
    Logger.info(`PERF-03: POST /transfer = ${responseTime}ms (HTTP ${res.status()})`);

    expect(res.status()).toBe(200);
    expect.soft(responseTime,
      `POST /transfer should return in under 3000 ms (actual: ${responseTime} ms)`
    ).toBeLessThan(3000);
  });
});