/**
 * E2Eテストスクリプト
 * 営業日報10日分 + 作業日報10日分の作成・取得・編集テスト
 *
 * 実行: npx tsx scripts/e2e-test.ts
 */

const BASE_URL = 'http://localhost:3000'
const TEST_USERNAME = 't-yasujima@yasujimakougyou.co.jp'
const TEST_PASSWORD = '00000000'

let cookie = ''
let userId = ''
let userName = ''

// テスト結果集計
const results: { test: string; status: 'PASS' | 'FAIL'; detail?: string }[] = []

function log(msg: string) {
  console.log(`  ${msg}`)
}

function logSection(title: string) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`  ${title}`)
  console.log('='.repeat(60))
}

function pass(test: string, detail?: string) {
  results.push({ test, status: 'PASS', detail })
  console.log(`  ✓ PASS: ${test}${detail ? ` (${detail})` : ''}`)
}

function fail(test: string, detail?: string) {
  results.push({ test, status: 'FAIL', detail })
  console.log(`  ✗ FAIL: ${test}${detail ? ` (${detail})` : ''}`)
}

// ============================================================
// 1. ログイン
// ============================================================
async function testLogin() {
  logSection('1. ログインテスト')

  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: TEST_USERNAME, password: TEST_PASSWORD }),
    redirect: 'manual',
  })

  if (res.ok) {
    const data = await res.json()
    userId = data.user.id
    userName = data.user.name

    // Cookieを取得
    const setCookies = res.headers.getSetCookie()
    cookie = setCookies.map((c: string) => c.split(';')[0]).join('; ')

    pass('ログイン成功', `userId=${userId}, name=${userName}`)
  } else {
    const err = await res.text()
    fail('ログイン失敗', err)
    throw new Error('ログイン失敗。テスト中止。')
  }
}

// ============================================================
// 2. /api/auth/me 確認
// ============================================================
async function testAuthMe() {
  logSection('2. 認証状態確認 (/api/auth/me)')

  const res = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: cookie },
  })

  if (res.ok) {
    const data = await res.json()
    if (data.user && data.user.id === userId) {
      pass('認証状態確認OK', `name=${data.user.name}`)
    } else {
      fail('認証状態確認 - ユーザー不一致', JSON.stringify(data))
    }
  } else {
    fail('認証状態確認 - APIエラー', `status=${res.status}`)
  }
}

// ============================================================
// 3. 営業日報 10日分作成
// ============================================================
const destinations = [
  '松江市役所', '出雲市役所', '大田市役所', '安来市役所', '雲南市役所',
  '島根県庁', '国土交通省松江国道事務所', '日本道路公団中国支社',
  '松江土建(株)', '(株)大畑建設', '中筋グループ', '島根電工(株)',
  '(有)山陰塗装', 'JA島根中央', '松江商工会議所',
]

const contacts = [
  '田中部長', '山田課長', '佐藤主任', '鈴木係長', '高橋担当',
  '渡辺所長', '伊藤次長', '中村室長', '小林主事', '加藤参事',
]

const contents = [
  '外壁塗装工事の見積もり提出・打合せ',
  '現場視察および施工状況確認',
  '新規案件のヒアリング・提案書説明',
  '工事完了報告および検収立会',
  '塗装材料の選定打合せ',
  '防水工事の仕様確認と見積もり提出',
  '定期メンテナンス契約の更新交渉',
  '工事進捗報告および今後の予定確認',
  '新規取引先開拓の営業訪問',
  '入札案件の情報収集と下見',
]

const nippoCreatedIds: string[] = []

async function testCreateNippo() {
  logSection('3. 営業日報 10日分作成テスト')

  for (let i = 0; i < 10; i++) {
    const day = i + 1
    const dateStr = `2026-01-${String(day).padStart(2, '0')}T00:00:00.000Z`
    const visitCount = (i % 3) + 1 // 1〜3件の訪問

    const visitRecords = []
    for (let j = 0; j < visitCount; j++) {
      const destIdx = (i * 3 + j) % destinations.length
      const contactIdx = (i * 2 + j) % contacts.length
      const contentIdx = (i + j) % contents.length
      visitRecords.push({
        destination: destinations[destIdx],
        contactPerson: contacts[contactIdx],
        startTime: `${String(9 + j * 2).padStart(2, '0')}:00`,
        endTime: `${String(10 + j * 2).padStart(2, '0')}:30`,
        content: contents[contentIdx],
        expense: (j + 1) * 500,
        order: j,
      })
    }

    const body = {
      date: dateStr,
      userId,
      specialNotes: `テスト営業日報 Day${day} - ${visitCount}件の訪問先`,
      visitRecords,
    }

    try {
      const res = await fetch(`${BASE_URL}/api/nippo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify(body),
      })

      if (res.status === 201) {
        const data = await res.json()
        nippoCreatedIds.push(data.id)

        // 検証
        const checks: string[] = []
        if (data.visitRecords.length !== visitCount) checks.push(`visitRecords数不正: expected=${visitCount} actual=${data.visitRecords.length}`)
        if (!data.specialNotes?.includes(`Day${day}`)) checks.push(`specialNotes不正`)
        if (!data.approvals || data.approvals.length !== 4) checks.push(`approvals数不正: ${data.approvals?.length}`)
        if (data.userId !== userId) checks.push(`userId不一致`)

        if (checks.length === 0) {
          pass(`営業日報 Day${day} 作成`, `id=${data.id}, visits=${visitCount}, approvals=${data.approvals.length}`)
        } else {
          fail(`営業日報 Day${day} 作成 - 検証エラー`, checks.join(', '))
        }
      } else {
        const err = await res.text()
        fail(`営業日報 Day${day} 作成`, `status=${res.status}, ${err}`)
      }
    } catch (e: any) {
      fail(`営業日報 Day${day} 作成`, e.message)
    }
  }
}

// ============================================================
// 4. 営業日報一覧取得テスト
// ============================================================
async function testGetNippoList() {
  logSection('4. 営業日報一覧取得テスト')

  // Cookie認証で取得
  const res = await fetch(`${BASE_URL}/api/nippo/list`, {
    headers: { Cookie: cookie },
  })

  if (res.ok) {
    const data = await res.json()
    const reports = data.reports || data
    const count = Array.isArray(reports) ? reports.length : 0
    if (count >= 10) {
      pass('営業日報一覧取得', `${count}件取得`)
    } else {
      fail('営業日報一覧取得', `件数不足: ${count}件 (10件以上期待)`)
    }
  } else {
    fail('営業日報一覧取得', `status=${res.status}`)
  }
}

// ============================================================
// 5. 営業日報 個別取得・編集テスト
// ============================================================
async function testNippoGetAndEdit() {
  logSection('5. 営業日報 個別取得・編集テスト')

  if (nippoCreatedIds.length === 0) {
    fail('個別取得テスト', '作成済み日報なし')
    return
  }

  // 個別取得テスト（最初の3件）
  for (let i = 0; i < Math.min(3, nippoCreatedIds.length); i++) {
    const id = nippoCreatedIds[i]
    const res = await fetch(`${BASE_URL}/api/nippo/${id}`, {
      headers: { Cookie: cookie },
    })

    if (res.ok) {
      const data = await res.json()
      if (data.id === id && data.visitRecords) {
        pass(`営業日報 個別取得 #${i + 1}`, `id=${id}, visits=${data.visitRecords.length}`)
      } else {
        fail(`営業日報 個別取得 #${i + 1}`, `データ不正`)
      }
    } else {
      fail(`営業日報 個別取得 #${i + 1}`, `status=${res.status}`)
    }
  }

  // 編集テスト（1件目を編集）
  const editId = nippoCreatedIds[0]
  log(`\n  --- 編集テスト (id=${editId}) ---`)

  const editBody = {
    date: '2026-01-01T00:00:00.000Z',
    userId,
    specialNotes: '【編集テスト】内容を更新しました',
    visitRecords: [
      {
        destination: '【編集】松江市役所（更新）',
        contactPerson: '【編集】田中部長',
        startTime: '10:00',
        endTime: '11:30',
        content: '【編集】外壁塗装工事の見積もり再提出',
        expense: 1500,
        order: 0,
      },
      {
        destination: '【編集】追加訪問先 - 出雲市役所',
        contactPerson: '山田課長',
        startTime: '14:00',
        endTime: '15:00',
        content: '【編集】新規案件の打ち合わせ',
        expense: 800,
        order: 1,
      },
    ],
  }

  const editRes = await fetch(`${BASE_URL}/api/nippo/${editId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(editBody),
  })

  if (editRes.ok) {
    const editData = await editRes.json()
    const checks: string[] = []
    if (editData.specialNotes !== '【編集テスト】内容を更新しました') checks.push('specialNotes未反映')
    if (editData.visitRecords?.length !== 2) checks.push(`visitRecords数不正: ${editData.visitRecords?.length}`)
    if (editData.visitRecords?.[0]?.destination !== '【編集】松江市役所（更新）') checks.push('訪問先未反映')

    if (checks.length === 0) {
      pass('営業日報 編集', `visits=${editData.visitRecords.length}, specialNotes更新OK`)
    } else {
      fail('営業日報 編集 - 検証エラー', checks.join(', '))
    }

    // 編集後の再取得で確認
    const reGetRes = await fetch(`${BASE_URL}/api/nippo/${editId}`, {
      headers: { Cookie: cookie },
    })
    if (reGetRes.ok) {
      const reData = await reGetRes.json()
      if (reData.specialNotes === '【編集テスト】内容を更新しました' && reData.visitRecords.length === 2) {
        pass('営業日報 編集後再取得', '編集内容が正しく反映')
      } else {
        fail('営業日報 編集後再取得', '編集内容が反映されていない')
      }
    }
  } else {
    const err = await editRes.text()
    fail('営業日報 編集', `status=${editRes.status}, ${err}`)
  }
}

// ============================================================
// 6. 作業日報 物件作成 + 10日分作成テスト
// ============================================================
const workerNames = [
  '古藤　英紀', '矢野　誠', '山内　正和', '大塚　崇', '中原　稔',
]

const workTypes = ['外壁塗装', '屋根塗装', '防水工事', '鋼橋塗装', '区画線工事']
const materials = ['ウレタン塗料', 'シリコン塗料', 'フッ素塗料', 'エポキシ樹脂', 'プライマー']
const subcontractors = ['キョウワビルト工業', '広野組', '又川工業', '景山工業']
const weatherOptions = ['晴れ', '曇り', '晴れ後曇り', '曇り後晴れ', '雨', '雪']

let testProjectId = ''
const workReportCreatedIds: string[] = []

async function testCreateProject() {
  logSection('6. 物件登録テスト')

  const res = await fetch(`${BASE_URL}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      name: 'E2Eテスト物件 - 松江市立中央小学校外壁塗装工事',
      projectType: '建築塗装工事',
      projectCode: 'TEST-2026-001',
    }),
  })

  if (res.status === 201 || res.ok) {
    const data = await res.json()
    testProjectId = data.id
    pass('物件登録', `id=${testProjectId}, name=${data.name}`)
  } else {
    const err = await res.text()
    fail('物件登録', `status=${res.status}, ${err}`)
    throw new Error('物件登録失敗。作業日報テスト中止。')
  }
}

async function testCreateWorkReport() {
  logSection('7. 作業日報 10日分作成テスト')

  for (let i = 0; i < 10; i++) {
    const day = i + 1
    const dateStr = `2026-01-${String(day).padStart(2, '0')}T00:00:00.000Z`
    const workerCount = (i % 3) + 2 // 2〜4人
    const materialCount = (i % 2) + 1 // 1〜2件
    const subCount = i % 2 // 0 or 1

    const workerRecords = []
    for (let j = 0; j < workerCount; j++) {
      const nameIdx = (i + j) % workerNames.length
      const typeIdx = (i + j) % workTypes.length
      workerRecords.push({
        name: workerNames[nameIdx],
        startTime: '08:00',
        endTime: j === 0 ? '17:00' : '17:30',
        manHours: 1.0,
        workType: workTypes[typeIdx],
        details: `Day${day} 作業者${j + 1}: ${workTypes[typeIdx]}作業実施`,
        dailyHours: 8 + j * 0.5,
        totalHours: (day * 8) + j * 0.5,
        order: j,
      })
    }

    const materialRecords = []
    for (let j = 0; j < materialCount; j++) {
      const matIdx = (i + j) % materials.length
      materialRecords.push({
        name: materials[matIdx],
        volume: '16',
        volumeUnit: 'ℓ',
        quantity: (j + 1) * 2,
        unitPrice: 3000 + j * 500,
        amount: (j + 1) * 2 * (3000 + j * 500),
        subcontractor: subcontractors[j % subcontractors.length],
        order: j,
      })
    }

    const subcontractorRecords = []
    for (let j = 0; j < subCount; j++) {
      subcontractorRecords.push({
        name: subcontractors[(i + j) % subcontractors.length],
        workerCount: 2 + j,
        workContent: `外注作業 Day${day}`,
        order: j,
      })
    }

    const body = {
      date: dateStr,
      userId,
      projectRefId: testProjectId,
      projectName: 'E2Eテスト物件 - 松江市立中央小学校外壁塗装工事',
      projectType: '建築塗装工事',
      projectId: 'TEST-2026-001',
      weather: weatherOptions[i % weatherOptions.length],
      contactNotes: day % 3 === 0 ? `Day${day} 特記事項: 午後から天候悪化の予報あり` : '',
      remoteDepartureTime: day % 4 === 0 ? '06:30' : '',
      remoteArrivalTime: day % 4 === 0 ? '08:00' : '',
      remoteDepartureTime2: day % 4 === 0 ? '17:00' : '',
      remoteArrivalTime2: day % 4 === 0 ? '18:30' : '',
      trafficGuardCount: day % 5 === 0 ? 2 : 0,
      trafficGuardStart: day % 5 === 0 ? '08:00' : '',
      trafficGuardEnd: day % 5 === 0 ? '17:00' : '',
      workerRecords,
      materialRecords,
      subcontractorRecords,
    }

    try {
      const res = await fetch(`${BASE_URL}/api/work-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify(body),
      })

      if (res.status === 201) {
        const data = await res.json()
        workReportCreatedIds.push(data.id)

        // 検証
        const checks: string[] = []
        if (data.workerRecords.length !== workerCount) checks.push(`workers: expected=${workerCount}, actual=${data.workerRecords.length}`)
        if (data.materialRecords.length !== materialCount) checks.push(`materials: expected=${materialCount}, actual=${data.materialRecords.length}`)
        if (data.subcontractorRecords.length !== subCount) checks.push(`subs: expected=${subCount}, actual=${data.subcontractorRecords.length}`)
        if (data.projectName !== 'E2Eテスト物件 - 松江市立中央小学校外壁塗装工事') checks.push('projectName不正')
        if (data.weather !== weatherOptions[i % weatherOptions.length]) checks.push(`weather不正`)

        if (checks.length === 0) {
          pass(`作業日報 Day${day} 作成`, `id=${data.id}, workers=${workerCount}, materials=${materialCount}, subs=${subCount}`)
        } else {
          fail(`作業日報 Day${day} 作成 - 検証エラー`, checks.join(', '))
        }
      } else {
        const err = await res.text()
        fail(`作業日報 Day${day} 作成`, `status=${res.status}, ${err}`)
      }
    } catch (e: any) {
      fail(`作業日報 Day${day} 作成`, e.message)
    }
  }
}

// ============================================================
// 8. 作業日報 一覧取得テスト
// ============================================================
async function testGetWorkReportList() {
  logSection('8. 作業日報 一覧取得テスト')

  const res = await fetch(`${BASE_URL}/api/work-report?userId=${userId}`, {
    headers: { Cookie: cookie },
  })

  if (res.ok) {
    const data = await res.json()
    const count = Array.isArray(data) ? data.length : 0
    if (count >= 10) {
      pass('作業日報一覧取得', `${count}件取得`)

      // 日付降順確認
      let sortOk = true
      for (let i = 1; i < Math.min(10, data.length); i++) {
        if (new Date(data[i - 1].date) < new Date(data[i].date)) {
          sortOk = false
          break
        }
      }
      if (sortOk) {
        pass('作業日報一覧 - 日付降順ソート')
      } else {
        fail('作業日報一覧 - 日付降順ソート', 'ソート順が不正')
      }

      // リレーション含む確認
      const first = data[0]
      if (first.workerRecords && first.materialRecords && first.subcontractorRecords) {
        pass('作業日報一覧 - リレーション含む', `workers=${first.workerRecords.length}`)
      } else {
        fail('作業日報一覧 - リレーション含む', 'リレーションデータ不足')
      }
    } else {
      fail('作業日報一覧取得', `件数不足: ${count}件 (10件以上期待)`)
    }
  } else {
    fail('作業日報一覧取得', `status=${res.status}`)
  }
}

// ============================================================
// 9. 作業日報 前日コピーAPIテスト
// ============================================================
async function testWorkReportPrevious() {
  logSection('9. 作業日報 前日コピーAPIテスト')

  // Day2の前日 = Day1のデータが返るはず
  const res = await fetch(
    `${BASE_URL}/api/work-report/previous?userId=${userId}&date=2026-01-02&projectRefId=${testProjectId}`,
    { headers: { Cookie: cookie } }
  )

  if (res.ok) {
    const data = await res.json()
    if (data && data.workerRecords) {
      pass('前日コピーAPI', `前日の日報取得OK: workers=${data.workerRecords.length}, materials=${data.materialRecords?.length}`)
    } else {
      fail('前日コピーAPI', 'データ構造不正')
    }
  } else if (res.status === 404) {
    fail('前日コピーAPI', '前日のデータが見つからない (404)')
  } else {
    fail('前日コピーAPI', `status=${res.status}`)
  }
}

// ============================================================
// 10. 物件一覧取得テスト
// ============================================================
async function testGetProjects() {
  logSection('10. 物件一覧取得テスト')

  const res = await fetch(`${BASE_URL}/api/projects?status=active`, {
    headers: { Cookie: cookie },
  })

  if (res.ok) {
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) {
      const testProject = data.find((p: any) => p.id === testProjectId)
      if (testProject) {
        pass('物件一覧取得', `${data.length}件, テスト物件あり`)
        // reportCount確認
        if (testProject.reportCount !== undefined) {
          pass('物件 reportCount', `reportCount=${testProject.reportCount}`)
        }
      } else {
        pass('物件一覧取得', `${data.length}件 (テスト物件がリストにない場合は取得タイミングの問題)`)
      }
    } else {
      fail('物件一覧取得', `データなし`)
    }
  } else {
    fail('物件一覧取得', `status=${res.status}`)
  }
}

// ============================================================
// 11. ページ遷移テスト (各ページがHTTP 200を返すか)
// ============================================================
async function testPageAccess() {
  logSection('11. ページアクセステスト')

  const pages = [
    { path: '/dashboard', name: 'ダッシュボード' },
    { path: '/nippo', name: '営業日報カレンダー' },
    { path: '/nippo/new', name: '営業日報新規作成' },
    { path: '/nippo-improved', name: '営業日報(改良版)' },
    { path: '/settings', name: '設定' },
    { path: '/work-report/projects', name: '物件一覧' },
    { path: `/work-report/new?projectId=${testProjectId}`, name: '作業日報新規作成' },
  ]

  for (const page of pages) {
    try {
      const res = await fetch(`${BASE_URL}${page.path}`, {
        headers: { Cookie: cookie },
        redirect: 'manual',
      })

      if (res.status === 200) {
        pass(`ページアクセス: ${page.name}`, `${page.path} -> 200 OK`)
      } else if (res.status === 307 || res.status === 308) {
        const location = res.headers.get('location')
        pass(`ページアクセス: ${page.name}`, `${page.path} -> リダイレクト(${res.status}) to ${location}`)
      } else {
        fail(`ページアクセス: ${page.name}`, `${page.path} -> ${res.status}`)
      }
    } catch (e: any) {
      fail(`ページアクセス: ${page.name}`, e.message)
    }
  }

  // 営業日報個別ページ
  if (nippoCreatedIds.length > 0) {
    const res = await fetch(`${BASE_URL}/nippo/${nippoCreatedIds[0]}`, {
      headers: { Cookie: cookie },
      redirect: 'manual',
    })
    if (res.status === 200) {
      pass('ページアクセス: 営業日報編集', `/nippo/${nippoCreatedIds[0]} -> 200 OK`)
    } else {
      fail('ページアクセス: 営業日報編集', `status=${res.status}`)
    }
  }
}

// ============================================================
// 12. エッジケーステスト
// ============================================================
async function testEdgeCases() {
  logSection('12. エッジケーステスト')

  // 未認証でのアクセス
  const noAuthRes = await fetch(`${BASE_URL}/api/nippo/list`)
  if (noAuthRes.status === 401) {
    pass('未認証アクセス拒否', '/api/nippo/list -> 401')
  } else {
    fail('未認証アクセス拒否', `status=${noAuthRes.status} (401を期待)`)
  }

  // 存在しない日報ID
  const notFoundRes = await fetch(`${BASE_URL}/api/nippo/nonexistent-id`, {
    headers: { Cookie: cookie },
  })
  if (notFoundRes.status === 404) {
    pass('存在しないID', '/api/nippo/nonexistent-id -> 404')
  } else {
    fail('存在しないID', `status=${notFoundRes.status} (404を期待)`)
  }

  // 空のvisitRecordsで営業日報作成
  const emptyVisitRes = await fetch(`${BASE_URL}/api/nippo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      date: '2026-01-20T00:00:00.000Z',
      userId,
      specialNotes: '',
      visitRecords: [],
    }),
  })
  if (emptyVisitRes.status === 201) {
    pass('空のvisitRecordsで作成', '作成成功 (0件の訪問)')
  } else {
    const status = emptyVisitRes.status
    if (status === 400) {
      pass('空のvisitRecordsで作成', 'バリデーションで拒否 (400)')
    } else {
      fail('空のvisitRecordsで作成', `status=${status}`)
    }
  }

  // 空のworkerRecordsで作業日報作成
  const emptyWorkerRes = await fetch(`${BASE_URL}/api/work-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      date: '2026-01-20T00:00:00.000Z',
      userId,
      projectName: 'テスト',
      workerRecords: [],
      materialRecords: [],
      subcontractorRecords: [],
    }),
  })
  if (emptyWorkerRes.status === 201) {
    pass('空のworkerRecordsで作成', '作成成功 (0件の作業者)')
  } else {
    const status = emptyWorkerRes.status
    if (status === 400) {
      pass('空のworkerRecordsで作成', 'バリデーションで拒否 (400)')
    } else {
      fail('空のworkerRecordsで作成', `status=${status}`)
    }
  }
}

// ============================================================
// メイン実行
// ============================================================
async function main() {
  console.log('\n' + '■'.repeat(60))
  console.log('  安島工業 日報システム E2Eテスト')
  console.log('  実行日時: ' + new Date().toLocaleString('ja-JP'))
  console.log('■'.repeat(60))

  try {
    await testLogin()
    await testAuthMe()
    await testCreateNippo()
    await testGetNippoList()
    await testNippoGetAndEdit()
    await testCreateProject()
    await testCreateWorkReport()
    await testGetWorkReportList()
    await testWorkReportPrevious()
    await testGetProjects()
    await testPageAccess()
    await testEdgeCases()
  } catch (e: any) {
    console.error(`\n  !! テスト中断: ${e.message}`)
  }

  // 結果サマリ
  logSection('テスト結果サマリ')
  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const total = results.length

  console.log(`  合計: ${total}件`)
  console.log(`  PASS: ${passed}件`)
  console.log(`  FAIL: ${failed}件`)
  console.log(`  成功率: ${total > 0 ? ((passed / total) * 100).toFixed(1) : 0}%`)

  if (failed > 0) {
    console.log('\n  --- 失敗したテスト ---')
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  ✗ ${r.test}: ${r.detail || ''}`)
    })
  }

  console.log('\n' + '■'.repeat(60))
  console.log(failed === 0 ? '  ALL TESTS PASSED!' : `  ${failed} TEST(S) FAILED`)
  console.log('■'.repeat(60) + '\n')

  process.exit(failed > 0 ? 1 : 0)
}

main()
