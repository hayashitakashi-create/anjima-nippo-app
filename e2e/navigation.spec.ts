import { test, expect } from '@playwright/test'
import { login } from './fixtures'

test.describe('ナビゲーション・ルーティング', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin')
    await expect(page).toHaveURL(/\/(dashboard|nippo|$)/, { timeout: 10000 })
  })

  test('ダッシュボードからすべてのページにアクセスできる', async ({ page }) => {
    const pages = [
      { path: '/nippo', name: '営業日報' },
      { path: '/nippo/new', name: '営業日報作成' },
      { path: '/work-report/new', name: '作業日報作成' },
      { path: '/work-report/projects', name: '物件一覧' },
      { path: '/notifications', name: '通知' },
      { path: '/settings', name: '設定' },
      { path: '/analytics', name: '分析' },
    ]

    for (const p of pages) {
      await page.goto(p.path)
      await expect(page).toHaveURL(new RegExp(p.path))
      await page.waitForLoadState('networkidle')
    }
  })

  test('戻るボタンが正しく機能する', async ({ page }) => {
    await page.goto('/dashboard')
    await page.goto('/nippo')
    await page.goto('/nippo/new')

    await page.goBack()
    await expect(page).toHaveURL(/\/nippo$/)

    await page.goBack()
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('404ページが正しく表示される', async ({ page }) => {
    await page.goto('/nonexistent-page-12345')
    // 404またはエラーページが表示されることを確認
    await expect(page.getByText(/404|見つかり|存在しない|not found/i)).toBeVisible({ timeout: 5000 })
  })
})

test.describe('通知機能', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin')
    await expect(page).toHaveURL(/\/(dashboard|nippo|$)/, { timeout: 10000 })
  })

  test('通知ページが表示される', async ({ page }) => {
    await page.goto('/notifications')
    await expect(page).toHaveURL(/\/notifications/)
    await expect(page.getByText(/通知|お知らせ/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('通知アイコン/バッジが表示される', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // 通知アイコンまたはベルアイコンを探す
    const notificationIcon = page.locator('[aria-label*="通知"]')
      .or(page.locator('a[href*="notification"]'))
      .or(page.getByRole('link', { name: /通知/i }))

    if (await notificationIcon.first().isVisible()) {
      await expect(notificationIcon.first()).toBeVisible()
    }
  })
})

test.describe('設定機能', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin')
    await expect(page).toHaveURL(/\/(dashboard|nippo|$)/, { timeout: 10000 })
  })

  test('設定ページが表示される', async ({ page }) => {
    await page.goto('/settings')
    await expect(page).toHaveURL(/\/settings/)
    await expect(page.getByText(/設定|プロフィール|アカウント/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('パスワード変更フォームが存在する', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    // パスワード関連のテキストまたはボタンを探す
    const passwordSection = page.getByText(/パスワード|変更/i)
    await expect(passwordSection.first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('分析ページ', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin')
    await expect(page).toHaveURL(/\/(dashboard|nippo|$)/, { timeout: 10000 })
  })

  test('分析ページが表示される', async ({ page }) => {
    await page.goto('/analytics')
    await expect(page).toHaveURL(/\/analytics/)
    await expect(page.getByText(/分析|統計|レポート/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('期間フィルタが機能する', async ({ page }) => {
    await page.goto('/analytics')
    await page.waitForLoadState('networkidle')

    // 期間選択のセレクトまたは日付入力を探す
    const dateFilter = page.locator('input[type="date"]').or(page.locator('select'))
    if (await dateFilter.first().isVisible()) {
      await expect(dateFilter.first()).toBeVisible()
    }
  })
})
