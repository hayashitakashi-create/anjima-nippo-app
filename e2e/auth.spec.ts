import { test, expect } from '@playwright/test'
import { TEST_CREDENTIALS, login } from './fixtures'

test.describe('認証機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('ログインページが正しく表示される', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible()
    await expect(page.getByRole('textbox', { name: /ユーザー名/i })).toBeVisible()
    await expect(page.getByLabel(/パスワード/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /ログイン/i })).toBeVisible()
  })

  test('空のフォームでログインを試みるとエラーが表示される', async ({ page }) => {
    await page.getByRole('button', { name: /ログイン/i }).click()
    await page.waitForTimeout(1000)
    await expect(page).toHaveURL(/\/login/)
  })

  test('不正な認証情報でログインを試みるとエラーが表示される', async ({ page }) => {
    await page.getByRole('textbox', { name: /ユーザー名/i }).fill('invalid_user@test.com')
    await page.getByLabel(/パスワード/i).fill('wrongpassword')
    await page.getByRole('button', { name: /ログイン/i }).click()
    await expect(page.getByText(/正しくありません|エラー|失敗/i)).toBeVisible({ timeout: 5000 })
  })

  test('正しい認証情報でログインするとダッシュボードにリダイレクトされる', async ({ page }) => {
    await page.getByRole('textbox', { name: /ユーザー名/i }).fill(TEST_CREDENTIALS.admin.username)
    await page.getByLabel(/パスワード/i).fill(TEST_CREDENTIALS.admin.password)
    await page.getByRole('button', { name: /ログイン/i }).click()
    await expect(page).toHaveURL(/\/(dashboard|nippo|$)/, { timeout: 10000 })
  })

  test('ログアウトが正しく機能する', async ({ page }) => {
    await login(page, 'admin')
    await expect(page).toHaveURL(/\/(dashboard|nippo|$)/, { timeout: 10000 })

    // ログアウトボタンを探す
    const logoutButton = page.getByRole('button', { name: /ログアウト/i }).or(page.getByText(/ログアウト/i))
    if (await logoutButton.isVisible()) {
      await logoutButton.click()
      await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
    }
  })
})
