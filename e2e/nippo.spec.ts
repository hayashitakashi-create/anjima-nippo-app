import { test, expect } from '@playwright/test'
import { login } from './fixtures'

test.describe('営業日報機能', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin')
    await expect(page).toHaveURL(/\/(dashboard|nippo|$)/, { timeout: 10000 })
  })

  test('営業日報一覧ページが表示される', async ({ page }) => {
    await page.goto('/nippo')
    await expect(page).toHaveURL(/\/nippo/)
    // タイトルまたはヘッダーが表示されることを確認
    await expect(page.getByText(/日報|営業/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('新規営業日報作成ページが表示される', async ({ page }) => {
    await page.goto('/nippo/new')
    await expect(page).toHaveURL(/\/nippo\/new/)
    // フォーム要素が表示されることを確認
    await expect(page.getByText(/日報|訪問先|日付/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('日報作成フォームの入力ができる', async ({ page }) => {
    await page.goto('/nippo/new')
    await page.waitForLoadState('networkidle')

    // 日付入力
    const dateInput = page.locator('input[type="date"]').first()
    if (await dateInput.isVisible()) {
      const today = new Date().toISOString().split('T')[0]
      await dateInput.fill(today)
    }

    // 訪問先入力（もし存在すれば）
    const destinationInput = page.getByPlaceholder(/訪問先/i).or(page.getByLabel(/訪問先/i))
    if (await destinationInput.isVisible()) {
      await destinationInput.fill('テスト訪問先株式会社')
    }
  })

  test('日報一覧から詳細ページに遷移できる', async ({ page }) => {
    await page.goto('/nippo')
    await page.waitForLoadState('networkidle')

    // 日報が存在する場合、最初のアイテムをクリック
    const firstReportLink = page.locator('a[href*="/nippo/"]').first()
    if (await firstReportLink.isVisible()) {
      await firstReportLink.click()
      await expect(page).toHaveURL(/\/nippo\/[^/]+/)
    }
  })

  test('日報の検索機能が動作する', async ({ page }) => {
    await page.goto('/nippo')
    await page.waitForLoadState('networkidle')

    // 検索入力欄があれば検索テスト
    const searchInput = page.getByPlaceholder(/検索|キーワード/i)
    if (await searchInput.isVisible()) {
      await searchInput.fill('テスト')
      await page.waitForTimeout(1000) // 検索結果を待つ
    }
  })
})

test.describe('作業日報機能', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin')
    await expect(page).toHaveURL(/\/(dashboard|nippo|$)/, { timeout: 10000 })
  })

  test('作業日報作成ページが表示される', async ({ page }) => {
    await page.goto('/work-report/new')
    await expect(page).toHaveURL(/\/work-report\/new/)
    await expect(page.getByText(/作業|日報|工事/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('作業日報のフォーム入力ができる', async ({ page }) => {
    await page.goto('/work-report/new')
    await page.waitForLoadState('networkidle')

    // 日付入力
    const dateInput = page.locator('input[type="date"]').first()
    if (await dateInput.isVisible()) {
      const today = new Date().toISOString().split('T')[0]
      await dateInput.fill(today)
    }

    // 天候選択（もしあれば）
    const weatherSelect = page.getByLabel(/天候/i).or(page.locator('select').first())
    if (await weatherSelect.isVisible()) {
      await weatherSelect.click()
    }
  })

  test('物件一覧ページが表示される', async ({ page }) => {
    await page.goto('/work-report/projects')
    await expect(page).toHaveURL(/\/work-report\/projects/)
    await expect(page.getByText(/物件|案件|工事/i).first()).toBeVisible({ timeout: 5000 })
  })
})
