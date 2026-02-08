import { chromium, Browser, Page } from 'playwright'
import * as path from 'path'
import * as fs from 'fs'

const BASE_URL = 'http://localhost:3000'
const SCREENSHOT_DIR = path.join(process.cwd(), 'public', 'screenshots')

// 管理者アカウント情報（環境変数またはデフォルト値）
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 't-yasujima@yasujimakougyou.co.jp'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '00000000'

interface Screenshot {
  filename: string
  path: string
  description: string
  action?: (page: Page) => Promise<void>
}

const screenshots: Screenshot[] = [
  {
    filename: '01_login.png',
    path: '/login',
    description: 'ログイン画面',
    action: async (page) => {
      // ログインフォームが表示されるまで待機
      await page.waitForSelector('input[type="text"], input[name="username"]', { timeout: 5000 })
    },
  },
  {
    filename: '02_dashboard.png',
    path: '/dashboard',
    description: 'ダッシュボード',
  },
  {
    filename: '03_nippo_list.png',
    path: '/nippo',
    description: '営業日報一覧',
  },
  {
    filename: '04_nippo_new.png',
    path: '/nippo/new',
    description: '営業日報新規作成',
    action: async (page) => {
      // フォームが表示されるまで待機
      await page.waitForTimeout(1000)
    },
  },
  {
    filename: '05_nippo_detail.png',
    path: '/nippo',
    description: '営業日報詳細',
    action: async (page) => {
      // 最初の日報をクリック
      const firstItem = await page.locator('a[href*="/nippo/"]').first()
      if (await firstItem.count() > 0) {
        await firstItem.click()
        await page.waitForTimeout(1000)
      }
    },
  },
  {
    filename: '06_work_report_list.png',
    path: '/work-report/projects',
    description: '作業日報（案件）一覧',
  },
  {
    filename: '07_work_report_new_top.png',
    path: '/work-report/new',
    description: '作業日報新規作成（上部）',
    action: async (page) => {
      await page.waitForTimeout(1000)
    },
  },
  {
    filename: '08_work_report_new_bottom.png',
    path: '/work-report/new',
    description: '作業日報新規作成（材料入力部分）',
    action: async (page) => {
      await page.waitForTimeout(500)
      // 材料セクションまでスクロール
      const materialSection = await page.locator('text=使用材料').first()
      if (await materialSection.count() > 0) {
        await materialSection.scrollIntoViewIfNeeded()
        await page.waitForTimeout(500)
      }
    },
  },
  {
    filename: '09_projects_list.png',
    path: '/work-report/projects',
    description: '案件一覧',
  },
  {
    filename: '10_project_detail.png',
    path: '/work-report/projects',
    description: '案件詳細',
    action: async (page) => {
      // 最初の案件をクリック
      const firstProject = await page.locator('a[href*="/work-report/projects/"]').first()
      if (await firstProject.count() > 0) {
        await firstProject.click()
        await page.waitForTimeout(1000)
      }
    },
  },
  {
    filename: '11_admin_top.png',
    path: '/admin',
    description: '管理画面トップ',
  },
  {
    filename: '12_admin_users.png',
    path: '/admin',
    description: 'ユーザー管理',
    action: async (page) => {
      // ユーザー管理セクションが表示されるまで待機
      await page.waitForTimeout(1000)
    },
  },
  {
    filename: '13_admin_approvals.png',
    path: '/admin/approvals',
    description: '承認管理',
  },
  {
    filename: '14_admin_materials.png',
    path: '/admin/materials',
    description: '材料マスタ管理',
  },
  {
    filename: '15_admin_units.png',
    path: '/admin/units',
    description: '単位マスタ管理',
  },
  {
    filename: '16_admin_subcontractors.png',
    path: '/admin/subcontractors',
    description: '外注先マスタ管理',
  },
  {
    filename: '17_admin_project_types.png',
    path: '/admin/project-types',
    description: '工事種別マスタ管理',
  },
  {
    filename: '18_admin_aggregation.png',
    path: '/admin/aggregation',
    description: '集計画面',
  },
  {
    filename: '19_admin_bulk_print.png',
    path: '/admin/bulk-print',
    description: '一括印刷',
  },
]

async function login(page: Page) {
  console.log('ログイン中...')
  await page.goto(`${BASE_URL}/login`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)

  // ユーザー名とパスワードを入力
  const usernameInput = await page.locator('input#username').first()
  await usernameInput.fill(ADMIN_USERNAME)

  const passwordInput = await page.locator('input#password').first()
  await passwordInput.fill(ADMIN_PASSWORD)

  // ログインボタンをクリックして、ナビゲーション完了を待つ
  const loginButton = await page.locator('button[type="submit"]').first()

  await Promise.all([
    page.waitForURL((url) => url.pathname.includes('/dashboard'), { timeout: 15000 }),
    loginButton.click(),
  ])

  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)
  console.log('✓ ログイン完了')
}

async function takeScreenshot(page: Page, screenshot: Screenshot) {
  try {
    console.log(`📸 撮影中: ${screenshot.description} (${screenshot.filename})`)

    // ページに移動
    if (!page.url().includes(screenshot.path)) {
      await page.goto(`${BASE_URL}${screenshot.path}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
    }

    // カスタムアクション実行
    if (screenshot.action) {
      await screenshot.action(page)
    }

    // スクリーンショット撮影
    const screenshotPath = path.join(SCREENSHOT_DIR, screenshot.filename)
    await page.screenshot({
      path: screenshotPath,
      fullPage: false, // ビューポート内のみ
    })

    console.log(`✓ 保存完了: ${screenshot.filename}`)
  } catch (error) {
    console.error(`✗ エラー: ${screenshot.filename}`, error)
  }
}

async function main() {
  // スクリーンショットディレクトリを作成
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
  }

  console.log('🚀 スクリーンショット撮影を開始します...\n')
  console.log(`対象URL: ${BASE_URL}`)
  console.log(`保存先: ${SCREENSHOT_DIR}\n`)

  const browser = await chromium.launch({
    headless: false, // デバッグ用に表示
  })

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'ja-JP',
  })

  const page = await context.newPage()

  try {
    // 1. ログイン画面のスクリーンショット（ログイン前）
    const loginScreenshot = screenshots.find((s) => s.filename === '01_login.png')
    if (loginScreenshot) {
      await page.goto(`${BASE_URL}${loginScreenshot.path}`)
      await page.waitForLoadState('networkidle')
      if (loginScreenshot.action) {
        await loginScreenshot.action(page)
      }
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, loginScreenshot.filename),
        fullPage: false,
      })
      console.log(`✓ 保存完了: ${loginScreenshot.filename}`)
    }

    // 2. ログイン
    await login(page)

    // 3. ログイン後の画面を撮影
    for (const screenshot of screenshots) {
      if (screenshot.filename === '01_login.png') {
        continue // ログイン画面はスキップ
      }
      await takeScreenshot(page, screenshot)
      await page.waitForTimeout(500) // 次の撮影まで少し待機
    }

    console.log('\n✅ すべてのスクリーンショット撮影が完了しました！')
    console.log(`保存先: ${SCREENSHOT_DIR}`)
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  } finally {
    await browser.close()
  }
}

main()
