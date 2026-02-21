import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const libsql = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})
const adapter = new PrismaLibSQL(libsql)
const prisma = new PrismaClient({ adapter })

// 10名分のユーザー（前半5名=作業日報、後半5名=営業日報）
const USERS = [
  { id: 'cmlaavp3t0000yl1oxd5ogu33', name: '安島　隆', type: 'work' },
  { id: 'cmlaavpp50001yl1ojqg7n44b', name: '金山昭徳', type: 'work' },
  { id: 'cmlaavpqd0002yl1og9r9g7hs', name: '古川一彦', type: 'work' },
  { id: 'cmlaavpro0003yl1o79b4xfla', name: '内田邦男', type: 'work' },
  { id: 'cmlaavpt30004yl1o2sxljwip', name: '福田誠', type: 'work' },
  { id: 'cmlaavpud0005yl1oc72zbuvt', name: '足立憲吉', type: 'sales' },
  { id: 'cmlaavpvu0006yl1ob6d8zywq', name: '松本倫典', type: 'sales' },
  { id: 'cmlaavpx70007yl1oz7z066e9', name: '松浦ひとみ', type: 'sales' },
  { id: 'cmlaavpz00008yl1oao6et81p', name: '門脇孝子', type: 'sales' },
  { id: 'cmlaavq0q0009yl1orzt6w1o3', name: '山崎伸一', type: 'sales' },
]

// === 作業日報用データ ===
const PROJECT_REF_ID = 'cmlu79fgj000fpyd7twqqm9em'
const PROJECT_NAME = '安島ビル　塗装工事'
const PROJECT_TYPE = '鋼橋塗装工事'
const PROJECT_CODE = '1000-11'

const TIME_PATTERNS = [
  { start: '08:00', end: '17:00' },
  { start: '08:00', end: '17:30' },
  { start: '08:30', end: '17:00' },
  { start: '07:30', end: '17:00' },
  { start: '08:00', end: '18:00' },
]

const WORK_TYPES = ['ケレン', '下塗り', '中塗り', '上塗り', '養生', '足場組立', '高圧洗浄', '錆止め塗装']

const WORK_DETAILS = [
  '外壁面ケレン作業（3階部分）',
  '鉄骨柱下塗り施工',
  '外壁中塗り作業（南面）',
  '屋上防水層上塗り',
  '窓枠・サッシ周り養生作業',
  '仮設足場3段目組立',
  '外壁高圧洗浄（北面）',
  '鉄部錆止め塗装（手摺り）',
  '天井面パテ処理・下地調整',
  '階段室壁面仕上げ塗装',
]

const WEATHER_OPTIONS = ['晴れ', '曇り', '晴れ時々曇り', '曇り時々雨']

// === 営業日報用データ ===
const DESTINATIONS = [
  '株式会社山田建設', '田中工務店', '鈴木設計事務所', '佐藤不動産',
  '中村ハウジング', '高橋建材', '渡辺塗料店', '伊藤商事',
  '加藤工業', '吉田電気工事',
]

const CONTACT_PERSONS = [
  '山田太郎', '田中次郎', '鈴木三郎', '佐藤四郎',
  '中村五郎', '高橋六郎', '渡辺七郎', '伊藤八郎',
  '加藤九郎', '吉田十郎',
]

const SALES_CONTENTS = [
  '塗装工事の見積もり提出・打ち合わせ',
  '新規案件のヒアリング',
  '工事進捗の報告',
  '追加工事の提案・説明',
  '完工検査の立ち会い',
  '請求書の提出・精算',
  '次期工事の打診',
  '材料選定の相談',
  'クレーム対応・現地確認',
  '定期メンテナンスの提案',
]

const SALES_TIME_PATTERNS = [
  { start: '09:00', end: '10:30' },
  { start: '10:00', end: '11:30' },
  { start: '13:00', end: '14:30' },
  { start: '14:00', end: '15:30' },
  { start: '15:00', end: '16:30' },
]

function calculateManHours(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  if (endMinutes <= startMinutes) return 0
  let totalMinutes = endMinutes - startMinutes
  const lunchStart = 12 * 60
  const lunchEnd = 13 * 60
  if (startMinutes < lunchEnd && endMinutes > lunchStart) {
    const overlapStart = Math.max(startMinutes, lunchStart)
    const overlapEnd = Math.min(endMinutes, lunchEnd)
    totalMinutes -= (overlapEnd - overlapStart)
  }
  return Number(((totalMinutes / 60) * 0.125).toFixed(5))
}

// 2月1日〜28日の平日10日間
const DATES = [
  '2026-02-02', '2026-02-03', '2026-02-04', '2026-02-05', '2026-02-06',
  '2026-02-09', '2026-02-10', '2026-02-11', '2026-02-12', '2026-02-13',
]

async function main() {
  console.log('=== テストデータ作成（2月1日〜28日期間、10名×10日） ===\n')

  // --- 作業日報 ---
  const workUsers = USERS.filter(u => u.type === 'work')
  let workCreated = 0

  console.log('--- 作業日報（5名×10日 = 50件）---')
  for (const dateStr of DATES) {
    for (let u = 0; u < workUsers.length; u++) {
      const user = workUsers[u]
      const dateIndex = DATES.indexOf(dateStr)
      const timePattern = TIME_PATTERNS[(u + dateIndex) % TIME_PATTERNS.length]
      const workType = WORK_TYPES[(u + dateIndex) % WORK_TYPES.length]
      const details = WORK_DETAILS[(u + dateIndex) % WORK_DETAILS.length]
      const weather = WEATHER_OPTIONS[dateIndex % WEATHER_OPTIONS.length]
      const manHours = calculateManHours(timePattern.start, timePattern.end)
      const dayIndex = dateIndex + 1
      const totalHours = Number((manHours * dayIndex).toFixed(5))

      await prisma.workReport.create({
        data: {
          date: new Date(dateStr + 'T00:00:00.000Z'),
          userId: user.id,
          projectRefId: PROJECT_REF_ID,
          projectName: PROJECT_NAME,
          projectType: PROJECT_TYPE,
          projectId: PROJECT_CODE,
          weather,
          contactNotes: '',
          workerRecords: {
            create: {
              name: user.name,
              startTime: timePattern.start,
              endTime: timePattern.end,
              workHours: manHours,
              workType,
              details,
              dailyHours: manHours,
              totalHours,
              order: 0,
            },
          },
        },
      })
      workCreated++
    }
    console.log(`  ${dateStr}: 5名分作成完了`)
  }

  // --- 営業日報 ---
  const salesUsers = USERS.filter(u => u.type === 'sales')
  let salesCreated = 0

  console.log('\n--- 営業日報（5名×10日 = 50件）---')
  for (const dateStr of DATES) {
    for (let u = 0; u < salesUsers.length; u++) {
      const user = salesUsers[u]
      const dateIndex = DATES.indexOf(dateStr)

      // 各営業日報に2件の訪問記録
      const dest1Idx = (u + dateIndex) % DESTINATIONS.length
      const dest2Idx = (u + dateIndex + 1) % DESTINATIONS.length
      const time1 = SALES_TIME_PATTERNS[(u + dateIndex) % SALES_TIME_PATTERNS.length]
      const time2 = SALES_TIME_PATTERNS[(u + dateIndex + 2) % SALES_TIME_PATTERNS.length]
      const content1 = SALES_CONTENTS[(u + dateIndex) % SALES_CONTENTS.length]
      const content2 = SALES_CONTENTS[(u + dateIndex + 1) % SALES_CONTENTS.length]

      await prisma.dailyReport.create({
        data: {
          date: new Date(dateStr + 'T00:00:00.000Z'),
          userId: user.id,
          specialNotes: dateIndex % 3 === 0 ? '特記事項なし' : '',
          visitRecords: {
            create: [
              {
                destination: DESTINATIONS[dest1Idx],
                contactPerson: CONTACT_PERSONS[dest1Idx],
                startTime: time1.start,
                endTime: time1.end,
                content: content1,
                expense: (dateIndex + u) % 3 === 0 ? 1500 : 0,
                order: 0,
              },
              {
                destination: DESTINATIONS[dest2Idx],
                contactPerson: CONTACT_PERSONS[dest2Idx],
                startTime: time2.start,
                endTime: time2.end,
                content: content2,
                expense: 0,
                order: 1,
              },
            ],
          },
        },
      })
      salesCreated++
    }
    console.log(`  ${dateStr}: 5名分作成完了`)
  }

  console.log(`\n=== 完了 ===`)
  console.log(`作業日報: ${workCreated}件`)
  console.log(`営業日報: ${salesCreated}件`)
  console.log(`合計: ${workCreated + salesCreated}件`)

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
