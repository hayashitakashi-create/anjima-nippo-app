import 'dotenv/config'
import { createClient } from '@libsql/client'
import fs from 'fs'
import path from 'path'

const envVercelPath = path.join(process.cwd(), '.env.vercel')
if (fs.existsSync(envVercelPath)) {
  const lines = fs.readFileSync(envVercelPath, 'utf-8').split('\n')
  for (const line of lines) {
    const m = line.match(/^([A-Z_]+)="?([^"]*)"?$/)
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2]
    }
  }
}

const url: string | undefined = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!url) {
  console.error('DATABASE_URL (or TURSO_DATABASE_URL) is required')
  process.exit(1)
}

const dbUrl: string = url
const client = createClient({ url: dbUrl, authToken })

const columns = [
  'familyName',
  'familyBirthdate',
  'familyRelationship',
  'adoptionDate',
  'specialAdoptionDate',
  'careReason',
]

async function main() {
  console.log(`Target DB: ${dbUrl.replace(/\/\/[^/]*/, '//***')}`)

  const existing = await client.execute(`PRAGMA table_info("LeaveRequest")`)
  const existingCols = new Set(existing.rows.map(r => String(r.name)))
  console.log(`Existing LeaveRequest columns: ${existingCols.size}`)

  for (const col of columns) {
    if (existingCols.has(col)) {
      console.log(`  - ${col}: already exists, skip`)
      continue
    }
    const sql = `ALTER TABLE "LeaveRequest" ADD COLUMN "${col}" TEXT`
    console.log(`  + ${sql}`)
    await client.execute(sql)
  }

  const after = await client.execute(`PRAGMA table_info("LeaveRequest")`)
  const afterCols = after.rows.map(r => String(r.name))
  console.log(`\nFinal LeaveRequest columns: ${afterCols.length}`)
  console.log(afterCols.join(', '))
}

main()
  .then(() => {
    console.log('\n✓ Done')
    process.exit(0)
  })
  .catch(err => {
    console.error('Failed:', err)
    process.exit(1)
  })
