import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const libsql = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})
const adapter = new PrismaLibSQL(libsql)
const prisma = new PrismaClient({ adapter })

// 作業員10名（Excelスクリーンショットに近い名前）
const workers = [
  { name: '矢野　誠', start: '07:00', end: '17:30' },
  { name: '山内　正和', start: '08:00', end: '17:00' },
  { name: '大塚　崇', start: '08:00', end: '17:00' },
  { name: '中原　稔', start: '08:00', end: '17:00' },
  { name: '三嶋　晶', start: '08:00', end: '17:00' },
  { name: '伊藤　勝', start: '08:00', end: '17:30' },
  { name: '古曵　正樹', start: '08:00', end: '17:00' },
  { name: '松本　太', start: '08:00', end: '17:00' },
  { name: '佐野　弘和', start: '08:00', end: '17:00' },
  { name: '満田　純一', start: '08:00', end: '17:00' },
]

// 2つのプロジェクトに分ける
const projectA = {
  refId: 'cmlcze2du0000styas9e7s9x8',
  name: 'ダンドリワーク社屋改装',
  type: '建築塗装工事',
  code: '01-11',
}
const projectB = {
  refId: 'cmld0vmr30000787d0tx5dz8u',
  name: '山田商店',
  type: '鋼橋塗装工事',
  code: '01-01',
}

// 2026年1月21日〜2月20日の期間で平日10日を選ぶ
const dates = [
  new Date('2026-01-21T00:00:00.000Z'), // 水
  new Date('2026-01-22T00:00:00.000Z'), // 木
  new Date('2026-01-23T00:00:00.000Z'), // 金
  new Date('2026-01-26T00:00:00.000Z'), // 月
  new Date('2026-01-27T00:00:00.000Z'), // 火
  new Date('2026-01-28T00:00:00.000Z'), // 水
  new Date('2026-01-29T00:00:00.000Z'), // 木
  new Date('2026-02-02T00:00:00.000Z'), // 月
  new Date('2026-02-03T00:00:00.000Z'), // 火
  new Date('2026-02-04T00:00:00.000Z'), // 水
]

// 日曜日も2日追加（Excel画面にある日曜カラム用）
const sundayDates = [
  new Date('2026-01-25T00:00:00.000Z'), // 日
  new Date('2026-02-01T00:00:00.000Z'), // 日
]

// 材料テンプレート
const materials = [
  { name: 'シリコン塗料', volume: '20', volumeUnit: 'ℓ', unitPrice: 8500, quantity: 3 },
  { name: 'プライマー', volume: '4', volumeUnit: 'ℓ', unitPrice: 3200, quantity: 2 },
  { name: 'マスキングテープ', volume: '', volumeUnit: '', unitPrice: 350, quantity: 10 },
]

// 外注テンプレート
const subcontractors = [
  { name: '(有)山陰足場', workerCount: 3, workContent: '足場組立' },
  { name: '松江クリーン(株)', workerCount: 2, workContent: '清掃作業' },
]

const adminUserId = 'cmlaavp3t0000yl1oxd5ogu33' // 安島　隆

async function main() {
  console.log('テストデータ投入開始...')

  let created = 0

  // 平日10日分
  for (const date of dates) {
    // プロジェクトA: 全10名
    const reportA = await prisma.workReport.create({
      data: {
        date,
        userId: adminUserId,
        projectRefId: projectA.refId,
        projectName: projectA.name,
        projectType: projectA.type,
        projectId: projectA.code,
        weather: '晴れ',
        remoteDepartureTime: '06:30',
        remoteArrivalTime: '07:00',
        remoteDepartureTime2: '17:30',
        remoteArrivalTime2: '18:00',
        workerRecords: {
          create: workers.map((w, i) => ({
            name: w.name,
            startTime: w.start,
            endTime: w.end,
            workType: '塗装工事',
            details: '外壁塗装作業',
            order: i,
          })),
        },
        materialRecords: {
          create: materials.map((m, i) => ({
            name: m.name,
            volume: m.volume,
            volumeUnit: m.volumeUnit,
            unitPrice: m.unitPrice,
            quantity: m.quantity,
            amount: m.unitPrice * m.quantity,
            order: i,
          })),
        },
        subcontractorRecords: {
          create: subcontractors.map((s, i) => ({
            name: s.name,
            workerCount: s.workerCount,
            workContent: s.workContent,
            order: i,
          })),
        },
      },
    })
    created++
    console.log(`  作成: ${date.toISOString().split('T')[0]} プロジェクトA (${reportA.id})`)

    // プロジェクトB: 前半5名のみ
    const reportB = await prisma.workReport.create({
      data: {
        date,
        userId: adminUserId,
        projectRefId: projectB.refId,
        projectName: projectB.name,
        projectType: projectB.type,
        projectId: projectB.code,
        weather: '晴れ',
        workerRecords: {
          create: workers.slice(0, 5).map((w, i) => ({
            name: w.name,
            startTime: '08:00',
            endTime: '17:00',
            workType: '鋼橋塗装',
            details: '橋梁塗装作業',
            order: i,
          })),
        },
      },
    })
    created++
    console.log(`  作成: ${date.toISOString().split('T')[0]} プロジェクトB (${reportB.id})`)
  }

  // 日曜2日分（プロジェクトAのみ、5名）
  for (const date of sundayDates) {
    const report = await prisma.workReport.create({
      data: {
        date,
        userId: adminUserId,
        projectRefId: projectA.refId,
        projectName: projectA.name,
        projectType: projectA.type,
        projectId: projectA.code,
        weather: '曇り',
        workerRecords: {
          create: workers.slice(0, 5).map((w, i) => ({
            name: w.name,
            startTime: '08:00',
            endTime: '17:00',
            workType: '塗装工事',
            details: '日曜作業',
            order: i,
          })),
        },
      },
    })
    created++
    console.log(`  作成: ${date.toISOString().split('T')[0]} 日曜 (${report.id})`)
  }

  console.log(`\n完了: ${created}件の作業日報を作成しました`)

  const total = await prisma.workReport.count()
  console.log(`DB内の作業日報合計: ${total}件`)

  await prisma.$disconnect()
}

main().catch(console.error)
