import 'dotenv/config'
import { createClient } from '@libsql/client'
import * as fs from 'fs'
import * as path from 'path'

async function main() {
  console.log('作業日報テーブルを作成しています...')

  const client = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  })

  // SQLファイルを読み込む
  const sqlPath = path.join(__dirname, '../prisma/create_work_report_tables.sql')
  const sql = fs.readFileSync(sqlPath, 'utf-8')

  // SQLを個別のステートメントに分割
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)

  // 各ステートメントを実行
  for (const statement of statements) {
    console.log(`実行中: ${statement.substring(0, 50)}...`)
    try {
      await client.execute(statement)
      console.log('✓ 成功')
    } catch (error) {
      console.error('エラー:', error)
    }
  }

  console.log('\nテーブル作成完了!')

  // テーブル一覧を確認
  const tables = await client.execute(`
    SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
  `)

  console.log('\n作成されたテーブル:')
  tables.rows.forEach((row: any) => {
    console.log(`  - ${row.name}`)
  })
}

main()
  .catch((e) => {
    console.error('エラーが発生しました:', e)
    process.exit(1)
  })
