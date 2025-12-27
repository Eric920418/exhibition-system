import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E 測試配置
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* 每個測試文件中測試的最大超時時間 */
  timeout: 30 * 1000,
  /* 測試預期的超時時間 */
  expect: {
    timeout: 5000,
  },
  /* 並行運行測試 */
  fullyParallel: true,
  /* CI 環境下禁止 test.only */
  forbidOnly: !!process.env.CI,
  /* CI 環境下失敗重試次數 */
  retries: process.env.CI ? 2 : 0,
  /* CI 環境下並行工作進程數量 */
  workers: process.env.CI ? 1 : undefined,
  /* 測試報告配置 */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  /* 所有測試的共享設置 */
  use: {
    /* 測試使用的基礎 URL */
    baseURL: 'http://localhost:3000',
    /* 收集失敗測試的追蹤信息 */
    trace: 'on-first-retry',
    /* 截圖設置 */
    screenshot: 'only-on-failure',
    /* 視頻錄製設置 */
    video: 'retain-on-failure',
  },

  /* 配置不同瀏覽器的測試項目 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /* 行動裝置測試 */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* 在開始測試前啟動開發伺服器 */
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
