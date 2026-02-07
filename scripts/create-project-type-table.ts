import { createClient } from '@libsql/client'
import * as dotenv from 'dotenv'
dotenv.config()

const client = createClient({
  url: process.env.DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
})

console.log('Database URL:', process.env.DATABASE_URL)

async function main() {
  // ProjectType テーブルを作成
  await client.execute(`
    CREATE TABLE IF NOT EXISTS ProjectType (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 0,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
  console.log('ProjectType table created')

  // デフォルトの工事種別を挿入
  const defaultTypes = [
    '建築塗装工事',
    '鋼橋塗装工事',
    '防水工事',
    '建築工事',
    '区画線工事',
  ]

  for (let i = 0; i < defaultTypes.length; i++) {
    const id = `pt_${Date.now()}_${i}`
    await client.execute({
      sql: `INSERT OR IGNORE INTO ProjectType (id, name, "order", isActive, createdAt, updatedAt) VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))`,
      args: [id, defaultTypes[i], i],
    })
    console.log(`Inserted: ${defaultTypes[i]}`)
  }

  console.log('Done!')
}

main().catch(console.error)
