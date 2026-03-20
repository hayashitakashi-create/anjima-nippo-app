import { chromium, Page } from 'playwright'
import * as path from 'path'
import * as fs from 'fs'

const BASE_URL = 'http://localhost:3000'
const SCREENSHOT_DIR = path.join(process.cwd(), 'docs', 'screenshots')

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 't-yasujima@yasujimakougyou.co.jp'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '00000000'

interface Screenshot {
  filename: string
  url: string
  description: string
  section: string
  fullPage?: boolean
  action?: (page: Page) => Promise<void>
}

const screenshots: Screenshot[] = [
  // ── 2. ログイン ──
  {
    filename: '02_01_login.png',
    url: '/login',
    description: 'ログイン画面',
    section: '2. ログイン',
    action: async (page) => {
      await page.waitForSelector('input#username', { timeout: 5000 })
    },
  },

  // ── 3. ダッシュボード ──
  {
    filename: '03_01_dashboard_sales.png',
    url: '/dashboard',
    description: 'ダッシュボード（営業日報タブ）',
    section: '3. ダッシュボード',
  },
  {
    filename: '03_02_dashboard_work.png',
    url: '/dashboard',
    description: 'ダッシュボード（作業日報タブ）',
    section: '3. ダッシュボード',
    action: async (page) => {
      // 作業日報タブをクリック
      const workTab = page.locator('button:has-text("作業日報")').first()
      if (await workTab.count() > 0) {
        await workTab.click()
        await page.waitForTimeout(800)
      }
    },
  },
  {
    filename: '03_03_dashboard_links.png',
    url: '/dashboard',
    description: 'ダッシュボード（クイックリンク部分）',
    section: '3. ダッシュボード',
    action: async (page) => {
      // クイックリンクセクションまでスクロール
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(500)
    },
  },

  // ── 4. 営業日報 ──
  {
    filename: '04_01_nippo_new.png',
    url: '/nippo-improved',
    description: '営業日報 新規作成画面',
    section: '4. 営業日報',
    fullPage: true,
  },
  {
    filename: '04_02_nippo_list.png',
    url: '/nippo',
    description: '営業日報 一覧画面',
    section: '4. 営業日報',
  },
  {
    filename: '04_03_nippo_detail.png',
    url: '/nippo',
    description: '営業日報 詳細画面',
    section: '4. 営業日報',
    action: async (page) => {
      const firstItem = page.locator('a[href*="/nippo/"]').first()
      if (await firstItem.count() > 0) {
        await firstItem.click()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)
      }
    },
    fullPage: true,
  },

  // ── 5. 作業日報 ──
  {
    filename: '05_01_work_projects.png',
    url: '/work-report/projects',
    description: '作業日報 物件一覧',
    section: '5. 作業日報',
  },
  {
    filename: '05_02_work_new_basic.png',
    url: '/work-report/new',
    description: '作業日報 新規作成（基本情報）',
    section: '5. 作業日報',
    action: async (page) => {
      await page.waitForTimeout(1000)
    },
  },
  {
    filename: '05_03_work_new_workers.png',
    url: '/work-report/new',
    description: '作業日報 新規作成（作業者記録）',
    section: '5. 作業日報',
    action: async (page) => {
      await page.waitForTimeout(500)
      const section = page.locator('text=作業者').first()
      if (await section.count() > 0) {
        await section.scrollIntoViewIfNeeded()
        await page.waitForTimeout(500)
      }
    },
  },
  {
    filename: '05_04_work_new_materials.png',
    url: '/work-report/new',
    description: '作業日報 新規作成（使用材料）',
    section: '5. 作業日報',
    action: async (page) => {
      await page.waitForTimeout(500)
      const section = page.locator('text=使用材料').first()
      if (await section.count() > 0) {
        await section.scrollIntoViewIfNeeded()
        await page.waitForTimeout(500)
      }
    },
  },
  {
    filename: '05_05_work_new_sub.png',
    url: '/work-report/new',
    description: '作業日報 新規作成（外注先）',
    section: '5. 作業日報',
    action: async (page) => {
      await page.waitForTimeout(500)
      const section = page.locator('text=外注先').first()
      if (await section.count() > 0) {
        await section.scrollIntoViewIfNeeded()
        await page.waitForTimeout(500)
      }
    },
  },
  {
    filename: '05_06_work_new_remote.png',
    url: '/work-report/new',
    description: '作業日報 新規作成（遠隔地・警備員）',
    section: '5. 作業日報',
    action: async (page) => {
      await page.waitForTimeout(500)
      const section = page.locator('text=遠隔地').first()
      if (await section.count() > 0) {
        await section.scrollIntoViewIfNeeded()
        await page.waitForTimeout(500)
      }
    },
  },

  // ── 6. テンプレート ──
  {
    filename: '06_01_templates.png',
    url: '/templates',
    description: 'テンプレート一覧',
    section: '6. テンプレート',
  },

  // ── 7. 一括日報作成 ──
  {
    filename: '07_01_bulk_create.png',
    url: '/work-report/bulk',
    description: '一括日報作成画面',
    section: '7. 一括日報作成',
  },

  // ── 8. 通知 ──
  {
    filename: '08_01_notifications.png',
    url: '/notifications',
    description: '通知一覧',
    section: '8. 通知',
  },

  // ── 9. レポート・分析 ──
  {
    filename: '09_01_reports.png',
    url: '/reports',
    description: 'レポート・分析画面',
    section: '9. レポート',
    fullPage: true,
  },

  // ── 10. アカウント設定 ──
  {
    filename: '10_01_settings.png',
    url: '/settings',
    description: 'アカウント設定画面',
    section: '10. 設定',
    fullPage: true,
  },

  // ── 11. 管理者機能 ──
  {
    filename: '11_01_admin_top.png',
    url: '/admin',
    description: '管理画面トップ（統計・メニュー）',
    section: '11. 管理者',
  },
  {
    filename: '11_02_admin_users.png',
    url: '/admin',
    description: '管理画面 ユーザー管理',
    section: '11. 管理者',
    action: async (page) => {
      await page.waitForTimeout(500)
      const section = page.locator('text=ユーザー管理').first()
      if (await section.count() > 0) {
        await section.scrollIntoViewIfNeeded()
        await page.waitForTimeout(500)
      }
    },
  },
  {
    filename: '11_03_admin_approvals.png',
    url: '/admin/approvals',
    description: '管理画面 承認管理',
    section: '11. 管理者',
  },
  {
    filename: '11_04_admin_approvals_scroll.png',
    url: '/admin/approvals',
    description: '管理画面 承認管理（一覧部分）',
    section: '11. 管理者',
    action: async (page) => {
      await page.waitForTimeout(500)
      await page.evaluate(() => window.scrollTo(0, 400))
      await page.waitForTimeout(500)
    },
  },
  {
    filename: '11_05_admin_projects.png',
    url: '/admin/projects',
    description: '管理画面 案件管理',
    section: '11. 管理者',
  },
  {
    filename: '11_06_admin_project_types.png',
    url: '/admin/project-types',
    description: '管理画面 工事種別マスタ',
    section: '11. 管理者',
  },
  {
    filename: '11_07_admin_materials.png',
    url: '/admin/materials',
    description: '管理画面 使用材料マスタ',
    section: '11. 管理者',
  },
  {
    filename: '11_08_admin_subcontractors.png',
    url: '/admin/subcontractors',
    description: '管理画面 外注先マスタ',
    section: '11. 管理者',
  },
  {
    filename: '11_09_admin_units.png',
    url: '/admin/units',
    description: '管理画面 単位マスタ',
    section: '11. 管理者',
  },
  {
    filename: '11_10_admin_system_settings.png',
    url: '/admin/system-settings',
    description: '管理画面 システム設定',
    section: '11. 管理者',
  },
  {
    filename: '11_11_admin_audit_log.png',
    url: '/admin/audit-log',
    description: '管理画面 操作ログ',
    section: '11. 管理者',
  },
  {
    filename: '11_12_admin_bulk_print.png',
    url: '/admin/bulk-print',
    description: '管理画面 一括印刷',
    section: '11. 管理者',
  },
  {
    filename: '11_13_admin_aggregation.png',
    url: '/admin/aggregation',
    description: '管理画面 労働時間集計',
    section: '11. 管理者',
  },
  {
    filename: '11_14_admin_aggregation_project.png',
    url: '/admin/aggregation/by-project',
    description: '管理画面 現場別集計',
    section: '11. 管理者',
  },
]

async function login(page: Page) {
  console.log('ログイン中...')
  await page.goto(`${BASE_URL}/login`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)

  await page.locator('input#username').first().fill(ADMIN_USERNAME)
  await page.locator('input#password').first().fill(ADMIN_PASSWORD)

  const loginButton = page.locator('button[type="submit"]').first()
  await Promise.all([
    page.waitForURL((url) => url.pathname.includes('/dashboard'), { timeout: 15000 }),
    loginButton.click(),
  ])

  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)
  console.log('✓ ログイン完了\n')
}

async function takeScreenshot(page: Page, ss: Screenshot) {
  try {
    console.log(`📸 [${ss.section}] ${ss.description} → ${ss.filename}`)

    // Navigate to URL
    await page.goto(`${BASE_URL}${ss.url}`, { timeout: 30000 })
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    // Run custom action
    if (ss.action) {
      await ss.action(page)
    }

    // Take screenshot
    const filePath = path.join(SCREENSHOT_DIR, ss.filename)
    await page.screenshot({
      path: filePath,
      fullPage: ss.fullPage || false,
    })

    console.log(`   ✓ 保存完了`)
  } catch (error) {
    console.error(`   ✗ エラー: ${ss.filename}`, error instanceof Error ? error.message : error)
  }
}

async function main() {
  // Create screenshot directory
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
  }

  console.log('====================================')
  console.log(' 操作説明書 スクリーンショット撮影')
  console.log('====================================\n')
  console.log(`対象URL: ${BASE_URL}`)
  console.log(`保存先:  ${SCREENSHOT_DIR}`)
  console.log(`撮影数:  ${screenshots.length}枚\n`)

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'ja-JP',
  })
  const page = await context.newPage()

  try {
    // 1. Login screen (before login)
    const loginSS = screenshots.find((s) => s.filename === '02_01_login.png')!
    console.log(`📸 [${loginSS.section}] ${loginSS.description} → ${loginSS.filename}`)
    await page.goto(`${BASE_URL}${loginSS.url}`)
    await page.waitForLoadState('networkidle')
    if (loginSS.action) await loginSS.action(page)
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, loginSS.filename),
      fullPage: false,
    })
    console.log(`   ✓ 保存完了\n`)

    // 2. Login
    await login(page)

    // 3. Take all other screenshots
    let currentSection = ''
    for (const ss of screenshots) {
      if (ss.filename === '02_01_login.png') continue
      if (ss.section !== currentSection) {
        currentSection = ss.section
        console.log(`\n── ${currentSection} ──`)
      }
      await takeScreenshot(page, ss)
      await page.waitForTimeout(300)
    }

    console.log('\n====================================')
    console.log(`✅ ${screenshots.length}枚のスクリーンショット撮影完了！`)
    console.log(`保存先: ${SCREENSHOT_DIR}`)
    console.log('====================================')
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  } finally {
    await browser.close()
  }
}

main()
