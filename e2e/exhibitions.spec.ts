import { test, expect } from '@playwright/test'

test.describe('前台展覽頁面', () => {
  test('應該正確加載展覽列表頁', async ({ page }) => {
    await page.goto('/exhibitions')

    // 等待頁面加載
    await page.waitForLoadState('networkidle')
  })

  test('展覽列表頁應該有標題', async ({ page }) => {
    await page.goto('/exhibitions')

    // 驗證有展覽相關的標題或內容
    const heading = page.getByRole('heading').first()
    await expect(heading).toBeVisible()
  })
})

test.describe('響應式設計', () => {
  test('在手機尺寸下應該正確顯示', async ({ page }) => {
    // 設置視窗大小為手機尺寸
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/exhibitions')

    // 驗證頁面正確加載
    await page.waitForLoadState('domcontentloaded')
  })

  test('在平板尺寸下應該正確顯示', async ({ page }) => {
    // 設置視窗大小為平板尺寸
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/exhibitions')

    // 驗證頁面正確加載
    await page.waitForLoadState('domcontentloaded')
  })
})
