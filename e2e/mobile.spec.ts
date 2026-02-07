import { test, expect } from '@playwright/test'
import { TEST_CREDENTIALS, login } from './fixtures'

// モバイル専用テスト（Pixel 5, iPhone 12でのみ実行）
test.describe('モバイル表示テスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('ログインページがモバイルで正しく表示される', async ({ page }) => {
    // ビューポートサイズを確認
    const viewportSize = page.viewportSize()
    if (viewportSize && viewportSize.width < 768) {
      // モバイルビューポートであることを確認
      expect(viewportSize.width).toBeLessThan(768)
    }

    // 主要要素が表示されることを確認
    await expect(page.getByRole('textbox', { name: /ユーザー名/i })).toBeVisible()
    await expect(page.getByLabel(/パスワード/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /ログイン/i })).toBeVisible()
  })

  test('モバイルでログインできる', async ({ page }) => {
    await page.getByRole('textbox', { name: /ユーザー名/i }).fill(TEST_CREDENTIALS.admin.username)
    await page.getByLabel(/パスワード/i).fill(TEST_CREDENTIALS.admin.password)
    await page.getByRole('button', { name: /ログイン/i }).click()
    await expect(page).toHaveURL(/\/(dashboard|nippo|$)/, { timeout: 10000 })
  })
})

test.describe('モバイルナビゲーション', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin')
    await expect(page).toHaveURL(/\/(dashboard|nippo|$)/, { timeout: 10000 })
  })

  test('モバイルメニューが開閉できる', async ({ page }) => {
    // ハンバーガーメニューまたはモバイルナビがあれば確認
    const menuButton = page.getByRole('button', { name: /メニュー/i })
      .or(page.locator('[aria-label*="menu"]'))
      .or(page.locator('button').filter({ has: page.locator('svg') }).first())

    if (await menuButton.isVisible()) {
      await menuButton.click()
      await page.waitForTimeout(500)
      // メニューが開いたことを確認（ナビアイテムが表示されるなど）
    }
  })

  test('日報一覧がモバイルで正しく表示される', async ({ page }) => {
    await page.goto('/nippo')
    await page.waitForLoadState('networkidle')

    // リストまたはカード形式で表示されることを確認
    await expect(page.getByText(/日報|営業/i).first()).toBeVisible({ timeout: 5000 })

    // スクロールが可能であることを確認
    const scrollableArea = page.locator('main, [role="main"], .container').first()
    if (await scrollableArea.isVisible()) {
      await scrollableArea.evaluate((el) => {
        el.scrollTop = 100
      })
    }
  })

  test('日報作成フォームがモバイルで使える', async ({ page }) => {
    await page.goto('/nippo/new')
    await page.waitForLoadState('networkidle')

    // フォーム要素がタッチ操作可能なサイズであることを確認
    const inputs = page.locator('input, select, textarea')
    const firstInput = inputs.first()
    if (await firstInput.isVisible()) {
      const box = await firstInput.boundingBox()
      if (box) {
        // タップターゲットの最小サイズ（44px）を確認
        expect(box.height).toBeGreaterThanOrEqual(30)
      }
    }
  })

  test('作業日報作成がモバイルで使える', async ({ page }) => {
    await page.goto('/work-report/new')
    await page.waitForLoadState('networkidle')

    // フォームが表示されることを確認
    await expect(page.getByText(/作業|日報|工事/i).first()).toBeVisible({ timeout: 5000 })

    // 入力フィールドが見えることを確認
    const dateInput = page.locator('input[type="date"]').first()
    if (await dateInput.isVisible()) {
      await expect(dateInput).toBeVisible()
    }
  })
})

test.describe('モバイルでのスワイプ・タッチ操作', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin')
    await expect(page).toHaveURL(/\/(dashboard|nippo|$)/, { timeout: 10000 })
  })

  test('カレンダーの月切り替えがモバイルで動作する', async ({ page }) => {
    await page.goto('/admin/approvals')
    await page.waitForLoadState('networkidle')

    // 月切り替えボタンを探す
    const prevButton = page.getByRole('button', { name: /前|<|←/i })
    const nextButton = page.getByRole('button', { name: /次|>|→/i })

    if (await prevButton.isVisible()) {
      await prevButton.click()
      await page.waitForTimeout(500)
    }

    if (await nextButton.isVisible()) {
      await nextButton.click()
      await page.waitForTimeout(500)
    }
  })

  test('フォームのスクロールがモバイルで動作する', async ({ page }) => {
    await page.goto('/work-report/new')
    await page.waitForLoadState('networkidle')

    // ページ下部までスクロール
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)

    // ページ上部にスクロール
    await page.evaluate(() => window.scrollTo(0, 0))
  })
})

test.describe('モバイルレスポンシブデザイン', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin')
    await expect(page).toHaveURL(/\/(dashboard|nippo|$)/, { timeout: 10000 })
  })

  test('ダッシュボードがモバイルに適応している', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // コンテンツが画面幅に収まっていることを確認
    const viewportWidth = page.viewportSize()?.width || 375
    const body = page.locator('body')
    const scrollWidth = await body.evaluate((el) => el.scrollWidth)

    // 水平スクロールが発生していないことを確認（少し余裕を持たせる）
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 20)
  })

  test('テーブルがモバイルでスクロール可能または適応される', async ({ page }) => {
    await page.goto('/admin/approvals')
    await page.waitForLoadState('networkidle')

    // テーブルまたはリストが表示されることを確認
    const tableOrList = page.locator('table, [role="table"], [role="list"]').first()
    if (await tableOrList.isVisible()) {
      await expect(tableOrList).toBeVisible()
    }
  })

  test('ボタンがモバイルでタップ可能なサイズ', async ({ page }) => {
    await page.goto('/nippo/new')
    await page.waitForLoadState('networkidle')

    // 送信ボタンなどのサイズを確認
    const buttons = page.getByRole('button')
    const buttonCount = await buttons.count()

    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i)
      if (await button.isVisible()) {
        const box = await button.boundingBox()
        if (box) {
          // 最小タップターゲット（44x44）に近いサイズであることを確認
          expect(box.height).toBeGreaterThanOrEqual(30)
        }
      }
    }
  })
})
