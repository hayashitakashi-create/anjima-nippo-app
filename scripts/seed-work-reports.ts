import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const libsql = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})
const adapter = new PrismaLibSQL(libsql)
const prisma = new PrismaClient({ adapter })

// 10名分のユーザーID
const USERS = [
  { id: 'cmlaavp3t0000yl1oxd5ogu33', name: '安島　隆' },
  { id: 'cmlaavpp50001yl1ojqg7n44b', name: '金山昭徳' },
  { id: 'cmlaavpqd0002yl1og9r9g7hs', name: '古川一彦' },
  { id: 'cmlaavpro0003yl1o79b4xfla', name: '内田邦男' },
  { id: 'cmlaavpt30004yl1o2sxljwip', name: '福田誠' },
  { id: 'cmlaavpud0005yl1oc72zbuvt', name: '足立憲吉' },
  { id: 'cmlaavpvu0006yl1ob6d8zywq', name: '松本倫典' },
  { id: 'cmlaavpx70007yl1oz7z066e9', name: '松浦ひとみ' },
  { id: 'cmlaavpz00008yl1oao6et81p', name: '門脇孝子' },
  { id: 'cmlaavq0q0009yl1orzt6w1o3', name: '山崎伸一' },
]

// プロジェクト
const PROJECT_REF_ID = 'cmlu79fgj000fpyd7twqqm9em'
const PROJECT_NAME = '安島ビル　塗装工事'
const PROJECT_TYPE = '鋼橋塗装工事'
const PROJECT_CODE = '1000-11'

// 作業時間パターン
const TIME_PATTERNS = [
  { start: '08:00', end: '17:00' },
  { start: '08:00', end: '17:30' },
  { start: '08:30', end: '17:00' },
  { start: '07:30', end: '17:00' },
  { start: '08:00', end: '18:00' },
]

// 工種
const WORK_TYPES = ['ケレン', '下塗り', '中塗り', '上塗り', '養生', '足場組立', '高圧洗浄', '錆止め塗装']

// 作業内容
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

// 天候
const WEATHER_OPTIONS = ['晴れ', '曇り', '晴れ時々曇り', '曇り時々雨']

// 工数計算
function calculateManHours(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  if (endMinutes <= startMinutes) return 0

  let totalMinutes = endMinutes - startMinutes

  // 昼休憩控除
  const lunchStart = 12 * 60
  const lunchEnd = 13 * 60
  if (startMinutes < lunchEnd && endMinutes > lunchStart) {
    const overlapStart = Math.max(startMinutes, lunchStart)
    const overlapEnd = Math.min(endMinutes, lunchEnd)
    totalMinutes -= (overlapEnd - overlapStart)
  }

  return Number(((totalMinutes / 60) * 0.125).toFixed(3))
}

async function main() {
  console.log('--- 既存の作業日報を削除 ---')

  // WorkerRecord, MaterialRecord, SubcontractorRecord はカスケード削除される
  const deleted = await prisma.workReport.deleteMany({})
  console.log(`削除完了: ${deleted.count}件`)

  console.log('\n--- 10名×10日分の作業日報を作成 ---')

  // 2026-02-10 〜 2026-02-21（土日除く10日間）
  const dates = [
    '2026-02-10', '2026-02-11', '2026-02-12', '2026-02-13',
    '2026-02-14', '2026-02-16', '2026-02-17', '2026-02-18',
    '2026-02-19', '2026-02-20',
  ]

  let created = 0

  for (const dateStr of dates) {
    for (let u = 0; u < USERS.length; u++) {
      const user = USERS[u]
      const timePattern = TIME_PATTERNS[(u + dates.indexOf(dateStr)) % TIME_PATTERNS.length]
      const workType = WORK_TYPES[(u + dates.indexOf(dateStr)) % WORK_TYPES.length]
      const details = WORK_DETAILS[(u + dates.indexOf(dateStr)) % WORK_DETAILS.length]
      const weather = WEATHER_OPTIONS[dates.indexOf(dateStr) % WEATHER_OPTIONS.length]
      const manHours = calculateManHours(timePattern.start, timePattern.end)

      // 累計工数（その日までの日数 × manHours）
      const dayIndex = dates.indexOf(dateStr) + 1
      const totalHours = Number((manHours * dayIndex).toFixed(3))

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
      created++
    }
    console.log(`${dateStr}: 10名分作成完了`)
  }

  console.log(`\n合計 ${created}件 の作業日報を作成しました`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
