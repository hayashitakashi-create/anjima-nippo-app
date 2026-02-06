import 'dotenv/config'
import { prisma } from '../lib/prisma'

async function main() {
  console.log('安島　隆さんを管理者に設定しています...')

  const user = await prisma.user.updateMany({
    where: {
      name: '安島　隆'
    },
    data: {
      role: 'admin'
    }
  })

  console.log(`更新完了: ${user.count}件のユーザーを管理者に設定しました`)

  // 確認
  const updatedUser = await prisma.user.findFirst({
    where: {
      name: '安島　隆'
    }
  })

  if (updatedUser) {
    console.log(`ユーザー名: ${updatedUser.name}`)
    console.log(`権限: ${updatedUser.role}`)
    console.log(`メールアドレス: ${updatedUser.username}`)
  }
}

main()
  .catch((e) => {
    console.error('エラーが発生しました:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
