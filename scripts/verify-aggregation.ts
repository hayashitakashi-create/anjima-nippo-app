import 'dotenv/config'
import { prisma } from '../lib/prisma'

async function main() {
  console.log('=== 月次集計データ検証 ===\n')

  // 今月の期間（21日〜翌月20日）
  const now = new Date()
  const currentDay = now.getDate()

  let periodStart: Date
  if (currentDay >= 21) {
    periodStart = new Date(now.getFullYear(), now.getMonth(), 21)
  } else {
    periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 21)
  }
  const periodEnd = new Date(
    periodStart.getFullYear(),
    periodStart.getMonth() + 1,
    20, 23, 59, 59, 999
  )

  console.log(`集計期間: ${periodStart.toISOString().split('T')[0]} 〜 ${periodEnd.toISOString().split('T')[0]}`)

  // 期間内の作業日報を取得
  const reports = await prisma.workReport.findMany({
    where: {
      date: { gte: periodStart, lte: periodEnd },
    },
    include: {
      workerRecords: true,
      materialRecords: true,
      subcontractorRecords: true,
    },
  })

  console.log(`期間内の作業日報: ${reports.length}件\n`)

  // ① 労働時間集計
  console.log('--- ① 労働時間集計 ---')
  const laborMap = new Map<string, number>()
  reports.forEach(r => {
    r.workerRecords.forEach(w => {
      if (!w.name) return
      const hours = w.workHours || w.dailyHours || 0
      laborMap.set(w.name, (laborMap.get(w.name) || 0) + hours)
    })
  })
  let totalLabor = 0
  Array.from(laborMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0], 'ja'))
    .forEach(([name, hours]) => {
      console.log(`  ${name.padEnd(12, '\u3000')} : ${hours.toFixed(3)}`)
      totalLabor += hours
    })
  console.log(`  ${'合計'.padEnd(12, '\u3000')} : ${totalLabor.toFixed(3)}`)
  console.log(`  作業員数: ${laborMap.size}名\n`)

  // ② 材料集計
  console.log('--- ② 材料集計 ---')
  const matMap = new Map<string, { qty: number; amount: number; volume: string; unitPrice: number }>()
  reports.forEach(r => {
    r.materialRecords.forEach(m => {
      if (!m.name) return
      const key = `${m.name}|${m.volume || ''}|${m.unitPrice || 0}`
      const entry = matMap.get(key) || { qty: 0, amount: 0, volume: `${m.volume || ''}${m.volumeUnit || ''}`, unitPrice: m.unitPrice || 0 }
      entry.qty += m.quantity || 0
      entry.amount += m.amount || 0
      matMap.set(key, entry)
    })
  })
  let totalAmount = 0
  Array.from(matMap.entries()).forEach(([key, val]) => {
    const name = key.split('|')[0]
    console.log(`  ${name.substring(0, 30).padEnd(30)} | ${val.volume.padStart(6)} | ${val.unitPrice.toString().padStart(6)} | ${val.qty.toString().padStart(4)} | ${val.amount.toLocaleString().padStart(10)}`)
    totalAmount += val.amount
  })
  console.log(`  ${'合計'.padEnd(30)}                                    | ${totalAmount.toLocaleString().padStart(10)}`)
  console.log(`  品目数: ${matMap.size}\n`)

  // ③ 外注集計
  console.log('--- ③ 外注集計 ---')
  const subMap = new Map<string, number>()
  reports.forEach(r => {
    r.subcontractorRecords.forEach(s => {
      if (!s.name) return
      subMap.set(s.name, (subMap.get(s.name) || 0) + (s.workerCount || 0))
    })
  })
  let totalSub = 0
  Array.from(subMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0], 'ja'))
    .forEach(([name, count]) => {
      console.log(`  ${name.padEnd(16, '\u3000')} : ${count}`)
      totalSub += count
    })
  console.log(`  ${'合計'.padEnd(16, '\u3000')} : ${totalSub}`)
  console.log(`  外注先数: ${subMap.size}社\n`)

  console.log('=== 検証完了 ===')
  console.log('月次集計ページ: /admin/aggregation')
}

main()
  .catch((e) => {
    console.error('エラー:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
