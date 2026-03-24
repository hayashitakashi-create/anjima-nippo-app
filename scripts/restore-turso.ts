/**
 * Turso DB復旧スクリプト
 *
 * 使い方:
 *   npx tsx scripts/restore-turso.ts backups/backup-YYYYMMDD-HHMMSS.json
 *
 * 注意:
 *   - 既存データは全て上書きされます
 *   - 必ず事前にバックアップを取ってから実行してください
 *   - 外部キー制約の都合上、復旧順序を守ります
 */

import { createClient } from '@libsql/client'
import * as fs from 'fs'

const client = createClient({
  url: process.env.DATABASE_URL || 'libsql://anjima-nippo-db-hayashitakashi-create.aws-ap-northeast-1.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN,
})

// 復旧順序（親テーブル→子テーブル）
const RESTORE_ORDER = [
  'User',
  'Project',
  'ProjectType',
  'Unit',
  'Material',
  'Subcontractor',
  'SystemSetting',
  'ApprovalRoute',
  'DailyReport',
  'VisitRecord',
  'Approval',
  'WorkReport',
  'WorkerRecord',
  'MaterialRecord',
  'SubcontractorRecord',
  'Notification',
  'LeaveRequest',
  'AuditLog',
]

async function restore(backupFile: string) {
  if (!fs.existsSync(backupFile)) {
    console.error(`ファイルが見つかりません: ${backupFile}`)
    process.exit(1)
  }

  const raw = fs.readFileSync(backupFile, 'utf-8')
  const backup = JSON.parse(raw)

  console.log(`バックアップ情報:`)
  console.log(`  作成日時: ${backup.timestamp}`)
  console.log(`  合計行数: ${backup.meta.totalRows}`)
  console.log(`  テーブル数: ${backup.meta.tableCount}`)
  console.log('')

  // 確認プロンプト
  console.log('⚠️  警告: 既存データは全て削除されます')
  console.log('続行するには環境変数 CONFIRM_RESTORE=yes を設定してください')
  if (process.env.CONFIRM_RESTORE !== 'yes') {
    console.log('中断しました')
    process.exit(0)
  }

  // 外部キー制約を一時無効化
  await client.execute('PRAGMA foreign_keys = OFF')

  for (const table of RESTORE_ORDER) {
    const rows = backup.tables[table]
    if (!rows || rows.length === 0) {
      console.log(`  ${table}: スキップ (0 rows)`)
      continue
    }

    try {
      // 既存データを削除
      await client.execute(`DELETE FROM "${table}"`)

      // バッチインサート（100行ずつ）
      const batchSize = 100
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize)
        for (const row of batch) {
          const columns = Object.keys(row)
          const placeholders = columns.map(() => '?').join(', ')
          const values = columns.map((col: string) => row[col])
          await client.execute({
            sql: `INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`,
            args: values,
          })
        }
      }
      console.log(`  ${table}: ${rows.length} rows 復旧完了`)
    } catch (err: any) {
      console.error(`  ${table}: 復旧エラー - ${err.message}`)
    }
  }

  // 外部キー制約を再有効化
  await client.execute('PRAGMA foreign_keys = ON')

  console.log('\n復旧完了')
}

const backupFile = process.argv[2]
if (!backupFile) {
  console.error('使い方: npx tsx scripts/restore-turso.ts <backup-file.json>')
  process.exit(1)
}

restore(backupFile).catch(err => {
  console.error('復旧エラー:', err)
  process.exit(1)
})
