import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const libsql = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})

const adapter = new PrismaLibSQL(libsql)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('====================================')
  console.log(' テストデータ一括削除')
  console.log('====================================\n')

  // 現状のデータ数を確認
  const beforeCounts = {
    dailyReports: await prisma.dailyReport.count(),
    visitRecords: await prisma.visitRecord.count(),
    approvals: await prisma.approval.count(),
    workReports: await prisma.workReport.count(),
    workerRecords: await prisma.workerRecord.count(),
    materialRecords: await prisma.materialRecord.count(),
    subcontractorRecords: await prisma.subcontractorRecord.count(),
    projects: await prisma.project.count(),
    templates: await prisma.workReportTemplate.count(),
    notifications: await prisma.notification.count(),
    auditLogs: await prisma.auditLog.count(),
  }

  console.log('【削除前のデータ数】')
  console.log(`  営業日報:       ${beforeCounts.dailyReports}件`)
  console.log(`  訪問記録:       ${beforeCounts.visitRecords}件`)
  console.log(`  承認:           ${beforeCounts.approvals}件`)
  console.log(`  作業日報:       ${beforeCounts.workReports}件`)
  console.log(`  作業者記録:     ${beforeCounts.workerRecords}件`)
  console.log(`  材料記録:       ${beforeCounts.materialRecords}件`)
  console.log(`  外注先記録:     ${beforeCounts.subcontractorRecords}件`)
  console.log(`  物件(現場):     ${beforeCounts.projects}件`)
  console.log(`  テンプレート:   ${beforeCounts.templates}件`)
  console.log(`  通知:           ${beforeCounts.notifications}件`)
  console.log(`  操作ログ:       ${beforeCounts.auditLogs}件`)
  console.log('')

  // 1. 営業日報の関連データを削除（Cascade設定あるが念のため明示的に）
  console.log('1/8 承認レコード削除中...')
  const delApprovals = await prisma.approval.deleteMany({})
  console.log(`   ✓ ${delApprovals.count}件削除`)

  console.log('2/8 訪問記録削除中...')
  const delVisitRecords = await prisma.visitRecord.deleteMany({})
  console.log(`   ✓ ${delVisitRecords.count}件削除`)

  console.log('3/8 営業日報削除中...')
  const delDailyReports = await prisma.dailyReport.deleteMany({})
  console.log(`   ✓ ${delDailyReports.count}件削除`)

  // 2. 作業日報の関連データを削除
  console.log('4/8 作業者記録削除中...')
  const delWorkerRecords = await prisma.workerRecord.deleteMany({})
  console.log(`   ✓ ${delWorkerRecords.count}件削除`)

  console.log('5/8 材料記録削除中...')
  const delMaterialRecords = await prisma.materialRecord.deleteMany({})
  console.log(`   ✓ ${delMaterialRecords.count}件削除`)

  console.log('6/8 外注先記録削除中...')
  const delSubcontractorRecords = await prisma.subcontractorRecord.deleteMany({})
  console.log(`   ✓ ${delSubcontractorRecords.count}件削除`)

  console.log('7/8 作業日報削除中...')
  const delWorkReports = await prisma.workReport.deleteMany({})
  console.log(`   ✓ ${delWorkReports.count}件削除`)

  // 3. 物件（現場）を削除
  console.log('8/8 物件(現場)削除中...')
  const delProjects = await prisma.project.deleteMany({})
  console.log(`   ✓ ${delProjects.count}件削除`)

  // 4. テンプレート削除
  const delTemplates = await prisma.workReportTemplate.deleteMany({})
  console.log(`   + テンプレート ${delTemplates.count}件削除`)

  // 5. 通知削除
  const delNotifications = await prisma.notification.deleteMany({})
  console.log(`   + 通知 ${delNotifications.count}件削除`)

  // 6. 操作ログ削除
  const delAuditLogs = await prisma.auditLog.deleteMany({})
  console.log(`   + 操作ログ ${delAuditLogs.count}件削除`)

  // 削除後の確認
  console.log('\n【削除後のデータ数】')
  console.log(`  営業日報:       ${await prisma.dailyReport.count()}件`)
  console.log(`  作業日報:       ${await prisma.workReport.count()}件`)
  console.log(`  物件(現場):     ${await prisma.project.count()}件`)
  console.log(`  通知:           ${await prisma.notification.count()}件`)

  // 残すデータの確認
  console.log('\n【保持するデータ】')
  console.log(`  ユーザー:       ${await prisma.user.count()}名`)
  console.log(`  承認ルート:     ${await prisma.approvalRoute.count()}件`)
  console.log(`  材料マスタ:     ${await prisma.material.count()}件`)
  console.log(`  外注先マスタ:   ${await prisma.subcontractor.count()}件`)
  console.log(`  工事種別マスタ: ${await prisma.projectType.count()}件`)
  console.log(`  単位マスタ:     ${await prisma.unit.count()}件`)
  console.log(`  システム設定:   ${await prisma.systemSetting.count()}件`)

  console.log('\n✅ テストデータの削除が完了しました！')
  console.log('   ユーザー・マスタデータ・承認ルート・システム設定は保持しています。')
}

main()
  .catch((e) => {
    console.error('❌ エラー:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
