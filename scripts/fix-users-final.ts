import 'dotenv/config'
import { prisma } from '../lib/prisma'

// Excelの正解データ（全27名）
const correctData: Record<string, { role: string; defaultReportType: string }> = {
  't-yasujima@yasujimakougyou.co.jp': { role: 'admin', defaultReportType: 'sales' },
  'yasujima@oregano.ocn.ne.jp': { role: 'admin', defaultReportType: 'sales' },
  'a-yasujima@yasujimakougyou.co.jp': { role: 'admin', defaultReportType: 'sales' },
  'a-kanayama@yasujimakougyou.co.jp': { role: 'admin', defaultReportType: 'sales' },
  'k-furukawa@yasujimakougyou.co.jp': { role: 'admin', defaultReportType: 'sales' },
  'm-matsumoto@yasujimakougyou.co.jp': { role: 'user', defaultReportType: 'sales' },
  'toso@yasujimakougyou.co.jp': { role: 'user', defaultReportType: 'work' },
  't-fukushiro@yasujimakougyou.co.jp': { role: 'admin', defaultReportType: 'work' },
  'm-fukuda@yasujimakougyou.co.jp': { role: 'admin', defaultReportType: 'sales' },
  'k-yasujima@yasujimakougyou.co.jp': { role: 'admin', defaultReportType: 'sales' },
  'yasujima9969@gmail.com': { role: 'user', defaultReportType: 'work' },
  'yasujima3406@gmail.com': { role: 'user', defaultReportType: 'work' },
  'yasujima7577@gmail.com': { role: 'user', defaultReportType: 'work' },
  'yasujima4706@gmail.com': { role: 'user', defaultReportType: 'work' },
  's-yamasaki@yasujimakougyou.co.jp': { role: 'user', defaultReportType: 'work' },
  'm-kotani@yasujimakougyou.co.jp': { role: 'admin', defaultReportType: 'sales' },
  't-kobayashi@yasujimakougyou.co.jp': { role: 'user', defaultReportType: 'work' },
  'matsuura@yasujimakougyou.co.jp': { role: 'admin', defaultReportType: 'sales' },
  'yasujima0013@gmail.com': { role: 'user', defaultReportType: 'work' },
  'n-adachi@yasujimakougyou.co.jp': { role: 'user', defaultReportType: 'work' },
  'yasujima3914@gmail.com': { role: 'user', defaultReportType: 'work' },
  'r-nakatani@yasujimakougyou.co.jp': { role: 'user', defaultReportType: 'work' },
  't-tanaka@yasujimakougyou.co.jp': { role: 'admin', defaultReportType: 'work' },
  's-takatsuka@yasujimakougyou.co.jp': { role: 'admin', defaultReportType: 'sales' },
  'k-uchida@yasujimakougyou.co.jp': { role: 'user', defaultReportType: 'work' },
  't-kadowaki@yasujimakougyou.co.jp': { role: 'admin', defaultReportType: 'sales' },
  's-kaneto@yasujimakougyou.co.jp': { role: 'user', defaultReportType: 'work' },
}

async function main() {
  const users = await prisma.user.findMany({
    select: { username: true, name: true, role: true, defaultReportType: true },
  })

  let fixed = 0
  for (const user of users) {
    const correct = correctData[user.username]
    if (correct === undefined) continue

    const needsRoleFix = user.role !== correct.role
    const needsReportFix = user.defaultReportType !== correct.defaultReportType

    if (needsRoleFix || needsReportFix) {
      await prisma.user.update({
        where: { username: user.username },
        data: { role: correct.role, defaultReportType: correct.defaultReportType },
      })
      const changes: string[] = []
      if (needsRoleFix) changes.push(`role: ${user.role} → ${correct.role}`)
      if (needsReportFix) changes.push(`report: ${user.defaultReportType} → ${correct.defaultReportType}`)
      console.log(`FIX: ${user.name} (${changes.join(', ')})`)
      fixed++
    }
  }

  console.log(`\n修正件数: ${fixed}`)

  // 最終確認
  console.log('\n=== 最終確認 ===')
  const all = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { name: true, username: true, role: true, defaultReportType: true },
  })

  for (const u of all) {
    const rl = u.role === 'admin' ? '管理者' : '一般'
    const rt = u.defaultReportType === 'work' ? '作業' : '営業'
    console.log(`${u.name.padEnd(10)} | ${u.username.padEnd(45)} | ${rl} | ${rt}`)
  }
  console.log(`合計: ${all.length}名`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
