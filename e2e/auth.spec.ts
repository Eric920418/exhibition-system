import { test, expect } from '@playwright/test'

test.describe('登入頁面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('應該顯示登入表單', async ({ page }) => {
    // 驗證表單元素存在
    await expect(page.getByLabel(/電子郵件|Email/i)).toBeVisible()
    await expect(page.getByLabel(/密碼|Password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /登入|Login/i })).toBeVisible()
  })

  test('應該顯示表單驗證錯誤', async ({ page }) => {
    // 直接點擊登入按鈕，不填寫任何內容
    await page.getByRole('button', { name: /登入|Login/i }).click()

    // 驗證顯示錯誤訊息（如果有驗證）
    // 根據實際實現調整
  })

  test('應該處理無效憑證', async ({ page }) => {
    // 填寫無效憑證
    await page.getByLabel(/電子郵件|Email/i).fill('invalid@test.com')
    await page.getByLabel(/密碼|Password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /登入|Login/i }).click()

    // 等待錯誤訊息
    await expect(page.getByText(/無效|錯誤|Invalid/i)).toBeVisible({ timeout: 10000 })
  })

  test('應該有註冊連結', async ({ page }) => {
    const registerLink = page.getByRole('link', { name: /註冊|Register/i })
    await expect(registerLink).toBeVisible()
  })
})

test.describe('註冊頁面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
  })

  test('應該顯示註冊表單', async ({ page }) => {
    // 驗證表單元素存在
    await expect(page.getByLabel(/姓名|Name/i)).toBeVisible()
    await expect(page.getByLabel(/電子郵件|Email/i)).toBeVisible()
    await expect(page.getByLabel(/密碼|Password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /註冊|Register/i })).toBeVisible()
  })

  test('應該有登入連結', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /登入|Login/i })
    await expect(loginLink).toBeVisible()
  })
})
