import { chromium } from 'playwright'

const BASE_URL = 'https://anjima-nippo-app.vercel.app'
const SCREENSHOT_DIR = 'public/release-notes/screenshots/v3'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1200 },
    locale: 'ja-JP',
  })
  const page = await context.newPage()

  const LOGIN_USER = process.env.LOGIN_USER
  const LOGIN_PASS = process.env.LOGIN_PASS
  if (!LOGIN_USER || !LOGIN_PASS) {
    throw new Error('LOGIN_USER / LOGIN_PASS env vars required')
  }
  console.log('Logging in as', LOGIN_USER)
  await page.goto(`${BASE_URL}/login`)
  await page.waitForTimeout(2000)
  const usernameInput = page.locator('input').first()
  const passwordInput = page.locator('input[type="password"]')
  await usernameInput.fill(LOGIN_USER)
  await passwordInput.fill(LOGIN_PASS)
  await page.click('button[type="submit"]')
  await page.waitForTimeout(5000)
  console.log('After login URL:', page.url())
  await page.screenshot({ path: `${SCREENSHOT_DIR}/debug_after_login.png` })
  if (page.url().includes('/settings')) {
    await page.goto(`${BASE_URL}/dashboard`)
    await page.waitForTimeout(3000)
  } else if (page.url().includes('/login')) {
    const errText = await page.locator('body').innerText()
    console.log('Login page content:', errText.slice(0, 500))
    throw new Error('Login failed')
  }
  console.log('Logged in! URL:', page.url())

  // 休暇届ページへ
  await page.goto(`${BASE_URL}/leave-requests`)
  await page.waitForTimeout(2500)

  // 休暇種別を「看護」にする
  const typeSelect = page.locator('select').nth(1) // 申請者名(0)→休暇種別(1)
  await typeSelect.selectOption('看護')
  await page.waitForTimeout(800)
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/leave_kango_form.png`,
    fullPage: false,
  })
  console.log('  leave_kango_form.png')

  // 休暇種別を「介護」にする
  await typeSelect.selectOption('介護')
  await page.waitForTimeout(800)
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/leave_kaigo_form.png`,
    fullPage: false,
  })
  console.log('  leave_kaigo_form.png')

  await browser.close()
  console.log('Done!')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
