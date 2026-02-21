import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const libsql = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})
const adapter = new PrismaLibSQL(libsql)
const prisma = new PrismaClient({ adapter })

const workers = [
  { name: '矢野　誠', start: '07:00', end: '17:30' },
  { name: '山内　正和', start: '08:00', end: '17:00' },
  { name: '大塚　崇', start: '08:00', end: '18:00' },
  { name: '中原　稔', start: '08:00', end: '17:00' },
  { name: '三嶋　晶', start: '08:00', end: '17:00' },
  { name: '伊藤　勝', start: '08:00', end: '17:30' },
  { name: '古曵　正樹', start: '08:00', end: '17:00' },
  { name: '松本　太', start: '08:00', end: '17:00' },
  { name: '佐野　弘和', start: '08:00', end: '17:00' },
  { name: '満田　純一', start: '08:00', end: '17:00' },
]

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

// 2026/2/21 - 2026/3/20 の期間内（平日10日 + 日曜2日）
const dates = [
  new Date('2026-02-23T00:00:00.000Z'), // 月
  new Date('2026-02-24T00:00:00.000Z'), // 火
  new Date('2026-02-25T00:00:00.000Z'), // 水
  new Date('2026-02-26T00:00:00.000Z'), // 木
  new Date('2026-02-27T00:00:00.000Z'), // 金
  new Date('2026-03-02T00:00:00.000Z'), // 月
  new Date('2026-03-03T00:00:00.000Z'), // 火
  new Date('2026-03-04T00:00:00.000Z'), // 水
  new Date('2026-03-05T00:00:00.000Z'), // 木
  new Date('2026-03-06T00:00:00.000Z'), // 金
]

const sundayDates = [
  new Date('2026-03-01T00:00:00.000Z'), // 日
  new Date('2026-03-08T00:00:00.000Z'), // 日
]

const materials = [
  { name: 'シリコン塗料', volume: '20', volumeUnit: 'ℓ', unitPrice: 8500, quantity: 3 },
  { name: 'プライマー', volume: '4', volumeUnit: 'ℓ', unitPrice: 3200, quantity: 2 },
  { name: 'マスキングテープ', volume: '', volumeUnit: '', unitPrice: 350, quantity: 10 },
]

const subcontractors = [
  { name: '(有)山陰足場', workerCount: 3, workContent: '足場組立' },
  { name: '松江クリーン(株)', workerCount: 2, workContent: '清掃作業' },
]

const adminUserId = 'cmlaavp3t0000yl1oxd5ogu33'

async function main() {
  console.log('当月テストデータ投入開始（2026/2/21 - 2026/3/20）...')

  let created = 0

  for (const date of dates) {
    // プロジェクトA: 全10名
    await prisma.workReport.create({
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

    // プロジェクトB: 前半5名
    await prisma.workReport.create({
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
    console.log(`  ${date.toISOString().split('T')[0]} 2件作成`)
  }

  // 日曜
  for (const date of sundayDates) {
    await prisma.workReport.create({
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
    console.log(`  ${date.toISOString().split('T')[0]} 日曜 1件作成`)
  }

  console.log(`\n完了: ${created}件作成`)
  await prisma.$disconnect()
}

main().catch(console.error)
