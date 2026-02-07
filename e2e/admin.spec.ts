import { test, expect } from '@playwright/test'
import { login } from './fixtures'

test.describe('管理者機能', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin')
    await expect(page).toHaveURL(/\/(dashboard|nippo|$)/, { timeout: 10000 })
  })

  test('管理者ダッシュボードにアクセスできる', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin/)
    await expect(page.getByText(/管理|設定|ユーザー/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('ユーザー管理ページが表示される', async ({ page }) => {
    await page.goto('/admin/settings')
    await page.waitForLoadState('networkidle')
    // ユーザー管理タブまたはセクションを確認
    const userSection = page.getByText(/ユーザー|社員|アカウント/i)
    await expect(userSection.first()).toBeVisible({ timeout: 5000 })
  })

  test('承認管理ページが表示される', async ({ page }) => {
    await page.goto('/admin/approvals')
    await expect(page).toHaveURL(/\/admin\/approvals/)
    await expect(page.getByText(/承認|日報|一覧/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('物件管理ページが表示される', async ({ page }) => {
    await page.goto('/admin/projects')
    await expect(page).toHaveURL(/\/admin\/projects/)
    await expect(page.getByText(/物件|工事|案件/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('材料マスタページが表示される', async ({ page }) => {
    await page.goto('/admin/materials')
    await expect(page).toHaveURL(/\/admin\/materials/)
    await expect(page.getByText(/材料|マスタ/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('外注先マスタページが表示される', async ({ page }) => {
    await page.goto('/admin/subcontractors')
    await expect(page).toHaveURL(/\/admin\/subcontractors/)
    await expect(page.getByText(/外注/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('工事種別マスタページが表示される', async ({ page }) => {
    await page.goto('/admin/project-types')
    await expect(page).toHaveURL(/\/admin\/project-types/)
    await expect(page.getByText(/工事|種別/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('操作ログページが表示される', async ({ page }) => {
    await page.goto('/admin/audit-log')
    await expect(page).toHaveURL(/\/admin\/audit-log/)
    await expect(page.getByText(/操作|ログ|履歴/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('一括印刷ページが表示される', async ({ page }) => {
    await page.goto('/admin/bulk-print')
    await expect(page).toHaveURL(/\/admin\/bulk-print/)
    await expect(page.getByText(/印刷|一括/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('システム設定ページが表示される', async ({ page }) => {
    await page.goto('/admin/system-settings')
    await expect(page).toHaveURL(/\/admin\/system-settings/)
    await expect(page.getByText(/設定|システム/i).first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('承認フロー', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin')
    await expect(page).toHaveURL(/\/(dashboard|nippo|$)/, { timeout: 10000 })
  })

  test('承認一覧でステータスフィルタが機能する', async ({ page }) => {
    await page.goto('/admin/approvals')
    await page.waitForLoadState('networkidle')

    // ステータスフィルタボタンがあれば確認
    const filterButtons = page.getByRole('button').or(page.locator('[data-status]'))
    await expect(filterButtons.first()).toBeVisible({ timeout: 5000 })
  })

  test('提出状況カレンダーが表示される', async ({ page }) => {
    await page.goto('/admin/approvals')
    await page.waitForLoadState('networkidle')

    // カレンダーまたは月表示を確認
    const calendarOrMonth = page.getByText(/月|カレンダー|提出状況/i)
    await expect(calendarOrMonth.first()).toBeVisible({ timeout: 5000 })
  })
})
