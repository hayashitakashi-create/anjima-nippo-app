import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const libsql = createClient({
  url: process.env.DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
})

const adapter = new PrismaLibSQL(libsql)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('デモ日報を登録中...')

  // ユーザー取得
  const users = await prisma.user.findMany({
    where: { role: 'user', isActive: true },
    select: { id: true, name: true },
  })

  if (users.length === 0) {
    console.log('アクティブなユーザーが見つかりません')
    return
  }

  const user = users[0]
  console.log(`ユーザー: ${user.name} (${user.id})`)

  // 過去10日分の日報を作成
  const today = new Date()
  const reports = []

  for (let i = 9; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)

    // 営業日報（訪問記録あり）
    const report = await prisma.dailyReport.create({
      data: {
        userId: user.id,
        date,
        visitRecords: {
          create: [
            {
              order: 1,
              destination: `株式会社サンプル${i + 1}`,
              contactPerson: `田中太郎${i}`,
              startTime: '09:00',
              endTime: '11:00',
              content: `新製品の提案を行いました。好感触でした。`,
              expense: 1500,
            },
            {
              order: 2,
              destination: `有限会社テスト${i + 2}`,
              contactPerson: `佐藤花子${i}`,
              startTime: '14:00',
              endTime: '16:00',
              content: `見積もり依頼を受けました。来週提出予定です。`,
              expense: 2000,
            },
          ],
        },
        specialNotes: i % 3 === 0 ? `天候不良のため、午後の訪問を変更しました。` : null,
      },
    })
    reports.push(report)
    console.log(`✓ 日報作成: ${date.toLocaleDateString('ja-JP')}`)
  }

  console.log(`\n合計 ${reports.length} 件の日報を作成しました`)
}

main()
  .catch((e) => {
    console.error('エラー:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
