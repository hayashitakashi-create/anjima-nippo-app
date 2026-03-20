import 'dotenv/config'
import { prisma } from '../lib/prisma'

async function main() {
  console.log('=== 本番データクリーンアップ開始 ===\n')

  // 1. 通知を全削除
  const notifCount = await prisma.notification.count()
  await prisma.notification.deleteMany()
  console.log(`通知: ${notifCount}件 削除`)

  // 2. 営業日報関連を削除（Approval → VisitRecord → DailyReport の順）
  const approvalCount = await prisma.approval.count()
  await prisma.approval.deleteMany()
  console.log(`承認: ${approvalCount}件 削除`)

  const visitCount = await prisma.visitRecord.count()
  await prisma.visitRecord.deleteMany()
  console.log(`訪問記録: ${visitCount}件 削除`)

  const salesCount = await prisma.dailyReport.count()
  await prisma.dailyReport.deleteMany()
  console.log(`営業日報: ${salesCount}件 削除`)

  // 3. 作業日報関連を削除（WorkerRecord → MaterialRecord → SubcontractorRecord → WorkReport の順）
  const workerCount = await prisma.workerRecord.count()
  await prisma.workerRecord.deleteMany()
  console.log(`作業者記録: ${workerCount}件 削除`)

  const matRecCount = await prisma.materialRecord.count()
  await prisma.materialRecord.deleteMany()
  console.log(`材料記録: ${matRecCount}件 削除`)

  const subRecCount = await prisma.subcontractorRecord.count()
  await prisma.subcontractorRecord.deleteMany()
  console.log(`外注記録: ${subRecCount}件 削除`)

  const workCount = await prisma.workReport.count()
  await prisma.workReport.deleteMany()
  console.log(`作業日報: ${workCount}件 削除`)

  // 4. 現場（プロジェクト）を全削除
  const projCount = await prisma.project.count()
  await prisma.project.deleteMany()
  console.log(`現場: ${projCount}件 削除`)

  // 5. 開発者アカウント削除（林崇 / dandori-work.com）
  const devUser = await prisma.user.findFirst({
    where: { username: { contains: 'dandori-work' } }
  })
  if (devUser) {
    await prisma.user.delete({ where: { id: devUser.id } })
    console.log(`開発者アカウント削除: ${devUser.name} (${devUser.username})`)
  }

  // 6. 監査ログ削除
  const auditCount = await prisma.auditLog.count()
  if (auditCount > 0) {
    await prisma.auditLog.deleteMany()
    console.log(`監査ログ: ${auditCount}件 削除`)
  }

  // 最終確認
  console.log('\n=== クリーンアップ完了 ===')
  console.log(`残存ユーザー: ${await prisma.user.count()}名`)
  console.log(`残存現場: ${await prisma.project.count()}件`)
  console.log(`残存営業日報: ${await prisma.dailyReport.count()}件`)
  console.log(`残存作業日報: ${await prisma.workReport.count()}件`)
  console.log(`残存通知: ${await prisma.notification.count()}件`)
  console.log(`残存マスタ - 材料: ${await prisma.material.count()}件, 外注先: ${await prisma.subcontractor.count()}件, 工種: ${await prisma.projectType.count()}件`)
}

main()
  .catch((e) => {
    console.error('エラー:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
