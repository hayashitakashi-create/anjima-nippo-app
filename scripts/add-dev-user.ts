import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'

async function main() {
  const password = await bcrypt.hash('00000000', 10)

  const user = await prisma.user.upsert({
    where: { username: 'hayashi.takashi@dandori-work.com' },
    update: {
      role: 'admin',
      defaultReportType: 'sales',
      isActive: true,
    },
    create: {
      name: '林　崇',
      username: 'hayashi.takashi@dandori-work.com',
      password,
      role: 'admin',
      defaultReportType: 'sales',
      position: null,
    },
  })

  console.log(`作成/更新: ${user.name} (${user.username})`)
  console.log(`  role: ${user.role}`)
  console.log(`  defaultReportType: ${user.defaultReportType} (営業=両方表示)`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
