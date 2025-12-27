import { test, expect } from '@playwright/test'

test.describe('首頁', () => {
  test('應該正確加載首頁', async ({ page }) => {
    await page.goto('/')

    // 驗證頁面標題
    await expect(page).toHaveTitle(/展覽/)
  })

  test('應該有導航連結', async ({ page }) => {
    await page.goto('/')

    // 驗證登入連結存在
    const loginLink = page.getByRole('link', { name: /登入/i })
    await expect(loginLink).toBeVisible()
  })
})

test.describe('導航功能', () => {
  test('應該能導航到登入頁面', async ({ page }) => {
    await page.goto('/')

    // 點擊登入連結
    await page.getByRole('link', { name: /登入/i }).click()

    // 驗證導航到登入頁面
    await expect(page).toHaveURL(/.*login/)
  })
})
