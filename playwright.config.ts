import { defineConfig, devices } from '@playwright/test';
import path from 'path';
export default defineConfig({
  testDir: './tests',
  outputDir: path.join(__dirname, 'test-results/artifacts'),

  timeout: 90000,
  expect: { timeout: 10000 },

  fullyParallel: true,
  workers: process.env.PW_WORKERS ? Number(process.env.PW_WORKERS) : 2,
  retries: 2,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'test-results/html-report', open: 'never' }],
    ['allure-playwright', {
      resultsDir: 'test-results/allure-results',
      detail: true,
      suiteTitle: true
    }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],

  use: {
    baseURL: 'http://localhost:9090/',

    actionTimeout: 20000,
    navigationTimeout: 30000,

    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    headless: !!process.env.CI || !process.env.HEADED,
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true
  },

 projects: [
    {
      name: 'chromium',
      testMatch: ['**/tests/ui/**/*.spec.ts', '**/tests/e2e/**/*.spec.ts' , '**/tests/api/**/*.spec.ts' , '**/tests/performance-lite/**/*.spec.ts'],
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      testMatch: ['**/tests/ui/**/*.spec.ts', '**/tests/e2e/**/*.spec.ts'],
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      testMatch: ['**/tests/ui/**/*.spec.ts', '**/tests/e2e/**/*.spec.ts'],
      use: { ...devices['Desktop Safari'] }
    },
    
  ]
});


