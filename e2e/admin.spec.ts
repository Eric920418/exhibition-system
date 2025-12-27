import { test, expect } from '@playwright/test'

test.describe('管理後台 - 未登入', () => {
  test('未登入用戶應該被重定向到登入頁面', async ({ page }) => {
    await page.goto('/admin')

    // 驗證被重定向到登入頁面
    await expect(page).toHaveURL(/.*login/)
  })

  test('未登入用戶訪問展覽管理應該被重定向', async ({ page }) => {
    await page.goto('/admin/exhibitions')

    // 驗證被重定向到登入頁面
    await expect(page).toHaveURL(/.*login/)
  })
})

test.describe('管理後台 - 已登入', () => {
  // 這些測試需要先設置認證狀態
  // 可以使用 storageState 來保存登入狀態

  test.skip('已登入用戶應該能看到儀表板', async ({ page }) => {
    // 需要先進行登入
    // 可以使用 page.route() 來 mock API 響應
    await page.goto('/admin')

    await expect(page.getByRole('heading', { name: /儀表板|Dashboard/i })).toBeVisible()
  })

  test.skip('側邊欄應該顯示所有管理選項', async ({ page }) => {
    await page.goto('/admin')

    // 驗證側邊欄選項
    await expect(page.getByRole('link', { name: /展覽管理/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /用戶管理/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /作品管理/i })).toBeVisible()
  })
})
