/**
 * E2E: 休暇届の代理記入者名(proxyWriterName) — 田邊様5/28 FB A
 * 実行: npx tsx scripts/e2e-proxy-writer.ts
 * シナリオ: 共有アカウント想定で未登録者(実習生)の休暇を代理申請し、
 *           手入力した代理記入者の実名が保存・取得されることを確認する。
 */
export {}

const BASE_URL = 'http://localhost:3000'
const TEST_USERNAME = 'test.taro@e2e.local'
const TEST_PASSWORD = 'test1234'

let cookie = ''
let loginName = ''

async function login() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: TEST_USERNAME, password: 'test1234' }),
    redirect: 'manual',
  })
  if (!res.ok) throw new Error('login失敗: ' + (await res.text()))
  const data = await res.json()
  loginName = data.user.name
  cookie = res.headers.getSetCookie().map((c: string) => c.split(';')[0]).join('; ')
  console.log(`✅ login: ${loginName}`)
}

async function run() {
  await login()

  const PROXY_NAME = '金山テスト記入者'
  const APPLICANT = '実習生テストE2E'
  const date = '2026-05-29'

  // 1) 未登録者(実習生)の代理申請 + 代理記入者実名を手入力
  const postRes = await fetch(`${BASE_URL}/api/leave-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      proxyForUnregistered: true,
      applicantName: APPLICANT,
      proxyWriterName: PROXY_NAME,
      date,
      leaveType: '有給',
      leaveUnit: 'full',
    }),
  })
  const postData = await postRes.json()
  if (!postRes.ok) throw new Error('POST失敗: ' + JSON.stringify(postData))
  const created = postData.leaveRequest
  console.log(`✅ POST成功 id=${created.id} proxyWriterName(DB)=${created.proxyWriterName}`)

  // 2) GET一覧で enteredByName が手入力の実名になっているか
  const month = '2026-05'
  const getRes = await fetch(`${BASE_URL}/api/leave-requests?month=${month}&scope=all`, {
    headers: { Cookie: cookie },
  })
  const getData = await getRes.json()
  const found = getData.leaveRequests.find((l: any) => l.id === created.id)
  if (!found) throw new Error('GET一覧に作成データが見つからない')

  console.log(`   GET: userName=${found.userName} / enteredByName=${found.enteredByName} / proxyWriterName=${found.proxyWriterName}`)

  // 検証
  const checks: [string, boolean][] = [
    ['DBにproxyWriterName保存', created.proxyWriterName === PROXY_NAME],
    ['申請者名=実習生名', found.userName === APPLICANT],
    ['代理記入者名=手入力の実名(ログイン名でない)', found.enteredByName === PROXY_NAME && found.enteredByName !== loginName],
  ]
  let ok = true
  for (const [label, pass] of checks) {
    console.log(`${pass ? '✅' : '❌'} ${label}`)
    if (!pass) ok = false
  }

  // 後始末: 作成したテストデータを削除
  await fetch(`${BASE_URL}/api/leave-requests/${created.id}`, { method: 'DELETE', headers: { Cookie: cookie } })
  console.log('🧹 テストデータ削除')

  if (!ok) { console.error('\n❌ E2E FAILED'); process.exit(1) }
  console.log('\n🎉 E2E PASSED')
}

run().catch(e => { console.error('❌', e); process.exit(1) })
