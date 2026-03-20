import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'

/**
 * Excelアカウント一覧に合わせてユーザーデータを修正
 */
async function main() {
  console.log('ユーザーデータ修正を開始します...\n')

  const defaultPassword = await bcrypt.hash('00000000', 10)

  // 1. 新規ユーザー追加
  console.log('=== 新規ユーザー追加 ===')
  const existing = await prisma.user.findUnique({
    where: { username: 's-kaneto@yasujimakougyou.co.jp' }
  })
  if (!existing) {
    const newUser = await prisma.user.create({
      data: {
        name: '金藤恵子',
        username: 's-kaneto@yasujimakougyou.co.jp',
        password: defaultPassword,
        role: 'user',
        defaultReportType: 'work',
        position: null,
      }
    })
    console.log(`  追加: ${newUser.name} (${newUser.username})`)
  } else {
    console.log('  金藤恵子 は既に登録済み')
  }

  // 2. 権限の修正
  console.log('\n=== 権限の修正 ===')
  const roleUpdates = [
    { username: 'm-matsumoto@yasujimakougyou.co.jp', role: 'user', name: '松本倫典' },
    { username: 'toso@yasujimakougyou.co.jp', role: 'user', name: '塗装' },
    { username: 'k-yasujima@yasujimakougyou.co.jp', role: 'admin', name: '安島圭介' },
    { username: 'm-kotani@yasujimakougyou.co.jp', role: 'admin', name: '小谷瑞希' },
    { username: 'matsuura@yasujimakougyou.co.jp', role: 'admin', name: '松浦ひとみ' },
    { username: 't-tanaka@yasujimakougyou.co.jp', role: 'admin', name: '田中剛士' },
    { username: 's-takatsuka@yasujimakougyou.co.jp', role: 'admin', name: '田邊沙帆' },
    { username: 't-kadowaki@yasujimakougyou.co.jp', role: 'admin', name: '門脇孝子' },
  ]

  for (const u of roleUpdates) {
    await prisma.user.update({
      where: { username: u.username },
      data: { role: u.role },
    })
    console.log(`  ${u.name}: role → ${u.role}`)
  }

  // 3. デフォルト日報タイプの修正
  console.log('\n=== デフォルト日報タイプの修正 ===')
  const reportTypeUpdates = [
    { username: 'toso@yasujimakougyou.co.jp', defaultReportType: 'work', name: '塗装' },
    { username: 't-fukushiro@yasujimakougyou.co.jp', defaultReportType: 'work', name: '福代司' },
    { username: 'yasujima9969@gmail.com', defaultReportType: 'work', name: '伊藤勝' },
    { username: 'yasujima3406@gmail.com', defaultReportType: 'work', name: '古曵正樹' },
    { username: 'yasujima7577@gmail.com', defaultReportType: 'work', name: '佐野弘和' },
    { username: 'yasujima4706@gmail.com', defaultReportType: 'work', name: '三嶋晶' },
    { username: 's-yamasaki@yasujimakougyou.co.jp', defaultReportType: 'work', name: '山崎伸一' },
    { username: 't-kobayashi@yasujimakougyou.co.jp', defaultReportType: 'work', name: '小林敬博' },
    { username: 'yasujima0013@gmail.com', defaultReportType: 'work', name: '松本太' },
    { username: 'n-adachi@yasujimakougyou.co.jp', defaultReportType: 'work', name: '足立憲吉' },
    { username: 'yasujima3914@gmail.com', defaultReportType: 'work', name: '大塚崇' },
    { username: 'r-nakatani@yasujimakougyou.co.jp', defaultReportType: 'work', name: '中谷凜大' },
    { username: 't-tanaka@yasujimakougyou.co.jp', defaultReportType: 'work', name: '田中剛士' },
    { username: 'k-uchida@yasujimakougyou.co.jp', defaultReportType: 'work', name: '内田邦男' },
  ]

  for (const u of reportTypeUpdates) {
    await prisma.user.update({
      where: { username: u.username },
      data: { defaultReportType: u.defaultReportType },
    })
    console.log(`  ${u.name}: defaultReportType → ${u.defaultReportType}`)
  }

  // 4. 最終確認
  console.log('\n=== 修正後の全ユーザー一覧 ===')
  const allUsers = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { name: true, username: true, role: true, defaultReportType: true },
  })

  for (const u of allUsers) {
    const roleLabel = u.role === 'admin' ? '管理者' : '一般'
    const reportLabel = u.defaultReportType === 'work' ? '作業' : '営業'
    console.log(`  ${u.name.padEnd(10)} | ${u.username.padEnd(45)} | ${roleLabel} | ${reportLabel}`)
  }

  console.log(`\n合計: ${allUsers.length}名`)
  console.log('\n修正完了！')
}

main()
  .catch((e) => {
    console.error('エラー:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
