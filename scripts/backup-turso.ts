/**
 * Turso DBバックアップスクリプト
 *
 * 使い方:
 *   npx tsx scripts/backup-turso.ts
 *
 * 動作:
 *   1. Turso DBから全テーブルのデータをJSONでエクスポート
 *   2. backups/ ディレクトリにタイムスタンプ付きで保存
 *
 * 復旧:
 *   npx tsx scripts/restore-turso.ts backups/backup-YYYYMMDD-HHMMSS.json
 */

import { createClient } from '@libsql/client'
import * as fs from 'fs'
import * as path from 'path'

const client = createClient({
  url: process.env.DATABASE_URL || 'libsql://anjima-nippo-db-hayashitakashi-create.aws-ap-northeast-1.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const TABLES = [
  'User',
  'DailyReport',
  'VisitRecord',
  'Approval',
  'ApprovalRoute',
  'WorkReport',
  'WorkerRecord',
  'MaterialRecord',
  'SubcontractorRecord',
  'Project',
  'ProjectType',
  'Unit',
  'Material',
  'Subcontractor',
  'Notification',
  'LeaveRequest',
  'SystemSetting',
  'AuditLog',
]

async function backup() {
  const now = new Date()
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`

  const backupDir = path.join(process.cwd(), 'backups')
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const data: Record<string, any[]> = {}
  let totalRows = 0

  for (const table of TABLES) {
    try {
      const result = await client.execute(`SELECT * FROM "${table}"`)
      data[table] = result.rows as any[]
      totalRows += result.rows.length
      console.log(`  ${table}: ${result.rows.length} rows`)
    } catch (err: any) {
      // テーブルが存在しない場合はスキップ
      if (err.message?.includes('no such table')) {
        console.log(`  ${table}: (テーブルなし - スキップ)`)
        data[table] = []
      } else {
        throw err
      }
    }
  }

  const backupFile = path.join(backupDir, `backup-${timestamp}.json`)

  // パスワードフィールドはマスクしない（復旧に必要）
  fs.writeFileSync(backupFile, JSON.stringify({
    version: 1,
    timestamp: now.toISOString(),
    tables: data,
    meta: { totalRows, tableCount: Object.keys(data).length },
  }, null, 2))

  const fileSizeMB = (fs.statSync(backupFile).size / 1024 / 1024).toFixed(2)
  console.log(`\nバックアップ完了: ${backupFile}`)
  console.log(`合計: ${totalRows} rows, ${fileSizeMB} MB`)

  // 古いバックアップを削除（30日以上前）
  const files = fs.readdirSync(backupDir).filter(f => f.startsWith('backup-') && f.endsWith('.json'))
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  for (const file of files) {
    const filePath = path.join(backupDir, file)
    const stat = fs.statSync(filePath)
    if (stat.mtimeMs < thirtyDaysAgo) {
      fs.unlinkSync(filePath)
      console.log(`古いバックアップを削除: ${file}`)
    }
  }
}

backup().catch(err => {
  console.error('バックアップエラー:', err)
  process.exit(1)
})
