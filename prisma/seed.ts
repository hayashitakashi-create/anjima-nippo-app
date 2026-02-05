import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('シードデータを投入しています...')

  // デフォルトパスワードをハッシュ化（全ユーザー共通: "00000000"）
  const defaultPassword = await bcrypt.hash('00000000', 10)

  // Excelファイルから取得したユーザーデータ
  const users = [
    { name: '安島　隆', username: 't-yasujima@yasujimakougyou.co.jp', role: 'admin', defaultReportType: 'sales' },
    { name: '金山昭徳', username: 'a-kanayama@yasujimakougyou.co.jp', role: 'admin', defaultReportType: 'sales' },
    { name: '古川一彦', username: 'k-furukawa@yasujimakougyou.co.jp', role: 'admin', defaultReportType: 'sales' },
    { name: '内田邦男', username: 'k-uchida@yasujimakougyou.co.jp', role: 'user', defaultReportType: 'sales' },
    { name: '福田誠', username: 'm-fukuda@yasujimakougyou.co.jp', role: 'admin', defaultReportType: 'sales' },
    { name: '足立憲吉', username: 'n-adachi@yasujimakougyou.co.jp', role: 'user', defaultReportType: 'sales' },
    { name: '松本倫典', username: 'm-matsumoto@yasujimakougyou.co.jp', role: 'admin', defaultReportType: 'sales' },
    { name: '松浦ひとみ', username: 'matsuura@yasujimakougyou.co.jp', role: 'user', defaultReportType: 'sales' },
    { name: '門脇孝子', username: 't-kadowaki@yasujimakougyou.co.jp', role: 'user', defaultReportType: 'sales' },
    { name: '山崎伸一', username: 's-yamasaki@yasujimakougyou.co.jp', role: 'user', defaultReportType: 'sales' },
    { name: '安島篤志', username: 'a-yasujima@yasujimakougyou.co.jp', role: 'admin', defaultReportType: 'sales' },
    { name: '安島圭介', username: 'k-yasujima@yasujimakougyou.co.jp', role: 'user', defaultReportType: 'sales' },
    { name: '田邊沙帆', username: 's-takatsuka@yasujimakougyou.co.jp', role: 'user', defaultReportType: 'sales' },
    { name: '小谷瑞希', username: 'm-kotani@yasujimakougyou.co.jp', role: 'user', defaultReportType: 'sales' },
    { name: '田中剛士', username: 't-tanaka@yasujimakougyou.co.jp', role: 'user', defaultReportType: 'sales' },
    { name: '小林敬博', username: 't-kobayashi@yasujimakougyou.co.jp', role: 'user', defaultReportType: 'sales' },
    { name: '福代司', username: 't-fukushiro@yasujimakougyou.co.jp', role: 'admin', defaultReportType: 'sales' },
    { name: '中谷凜大', username: 'r-nakatani@yasujimakougyou.co.jp', role: 'user', defaultReportType: 'sales' },
    { name: '大塚崇', username: 'yasujima3914@gmail.com', role: 'user', defaultReportType: 'sales' },
    { name: '三嶋晶', username: 'yasujima4706@gmail.com', role: 'user', defaultReportType: 'sales' },
    { name: '伊藤勝', username: 'yasujima9969@gmail.com', role: 'user', defaultReportType: 'sales' },
    { name: '古曵正樹', username: 'yasujima3406@gmail.com', role: 'user', defaultReportType: 'sales' },
    { name: '松本太', username: 'yasujima0013@gmail.com', role: 'user', defaultReportType: 'sales' },
    { name: '佐野弘和', username: 'yasujima7577@gmail.com', role: 'user', defaultReportType: 'sales' },
    { name: '塗装　', username: 'toso@yasujimakougyou.co.jp', role: 'admin', defaultReportType: 'sales' },
    { name: '安島壮', username: 'yasujima@oregano.ocn.ne.jp', role: 'admin', defaultReportType: 'sales' },
  ]

  for (let i = 0; i < users.length; i++) {
    const userData = users[i]

    const user = await prisma.user.create({
      data: {
        name: userData.name,
        username: userData.username,
        password: defaultPassword,
        role: userData.role,
        defaultReportType: userData.defaultReportType,
        position: null,
      },
    })
    const reportTypeName = userData.defaultReportType === 'sales' ? '営業日報' : '作業日報'
    console.log(`作成: ${user.name} (メール: ${user.username}) (権限: ${user.role === 'admin' ? '管理者' : '一般社員'}) (デフォルト: ${reportTypeName})`)
  }

  console.log('\nシードデータの投入が完了しました！')
  console.log(`登録ユーザー数: ${users.length}名`)
  console.log('デフォルトパスワード: 00000000')
}

main()
  .catch((e) => {
    console.error('エラーが発生しました:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
