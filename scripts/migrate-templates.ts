import { createClient } from '@libsql/client'
import * as dotenv from 'dotenv'

dotenv.config()

async function migrate() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL)
  const client = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  console.log('Creating WorkReportTemplate table...')

  await client.execute(`
    CREATE TABLE IF NOT EXISTS WorkReportTemplate (
      id TEXT PRIMARY KEY NOT NULL,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      projectRefId TEXT,
      projectName TEXT,
      projectType TEXT,
      remoteDepartureTime TEXT,
      remoteArrivalTime TEXT,
      remoteDepartureTime2 TEXT,
      remoteArrivalTime2 TEXT,
      trafficGuardCount INTEGER,
      trafficGuardStart TEXT,
      trafficGuardEnd TEXT,
      workerRecords TEXT,
      materialRecords TEXT,
      subcontractorRecords TEXT,
      isShared INTEGER DEFAULT 0 NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt DATETIME NOT NULL
    )
  `)

  console.log('Creating indexes...')

  await client.execute(`CREATE INDEX IF NOT EXISTS WorkReportTemplate_userId_idx ON WorkReportTemplate(userId)`)
  await client.execute(`CREATE INDEX IF NOT EXISTS WorkReportTemplate_isShared_idx ON WorkReportTemplate(isShared)`)

  console.log('Migration completed successfully!')
  process.exit(0)
}

migrate().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
