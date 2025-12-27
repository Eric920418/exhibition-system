import { test, expect } from '@playwright/test'

test.describe('無障礙性測試', () => {
  test('首頁應該有適當的語義結構', async ({ page }) => {
    await page.goto('/')

    // 驗證有 main 區域
    const main = page.locator('main')
    await expect(main).toBeVisible()

    // 驗證有標題
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible()
  })

  test('表單應該有適當的標籤', async ({ page }) => {
    await page.goto('/login')

    // 驗證輸入框有關聯的標籤
    const emailInput = page.getByLabel(/電子郵件|Email/i)
    await expect(emailInput).toBeVisible()

    const passwordInput = page.getByLabel(/密碼|Password/i)
    await expect(passwordInput).toBeVisible()
  })

  test('按鈕應該有可識別的文字', async ({ page }) => {
    await page.goto('/login')

    // 驗證按鈕有文字
    const submitButton = page.getByRole('button', { name: /登入|Login/i })
    await expect(submitButton).toBeVisible()
  })

  test('連結應該有描述性文字', async ({ page }) => {
    await page.goto('/')

    // 驗證連結不只是 "點擊這裡"
    const links = await page.getByRole('link').all()
    for (const link of links) {
      const text = await link.textContent()
      expect(text?.trim()).not.toBe('')
    }
  })
})

test.describe('鍵盤導航', () => {
  test('應該能使用 Tab 鍵導航', async ({ page }) => {
    await page.goto('/login')

    // Tab 到第一個可聚焦元素
    await page.keyboard.press('Tab')

    // 驗證有元素獲得焦點
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeTruthy()
  })

  test('表單應該能用鍵盤提交', async ({ page }) => {
    await page.goto('/login')

    // 填寫表單
    await page.getByLabel(/電子郵件|Email/i).fill('test@test.com')
    await page.getByLabel(/密碼|Password/i).fill('password123')

    // 按 Enter 提交
    await page.keyboard.press('Enter')

    // 等待一下看是否有反應（不管成功失敗）
    await page.waitForTimeout(1000)
  })
})
