// data.db.txt로 스키마+모든 행을 사람이 읽을 수 있는 형태로 덤프한다 — DB 내용이 바뀔 때마다
// `node server/dump-db.js`로 다시 생성하면 된다.
// password_hash는 비밀번호 원문은 아니지만 그대로 노출할 이유가 없어 이 덤프에서는 가린다.
import fs from 'node:fs'
import { pool } from './db.js'

const REDACT_COLUMNS = new Set(['password_hash'])
const OUTPUT_PATH = new URL('./data.db.txt', import.meta.url)

function formatValue(value) {
  if (value === null) return 'NULL'
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string' && value.length > 200) return `${value.slice(0, 200)}…`
  return String(value)
}

async function dumpTable(tableName) {
  const { rows: columnRows } = await pool.query(
    'SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 ORDER BY ordinal_position',
    ['public', tableName]
  )
  const columns = columnRows.map((c) => c.column_name)
  const { rows } = await pool.query(`SELECT * FROM ${tableName}`)

  const lines = [`## ${tableName} (${rows.length}행)`, '']
  lines.push(columns.join(' | '))
  lines.push(columns.map(() => '---').join(' | '))
  for (const row of rows) {
    lines.push(columns.map((name) => (REDACT_COLUMNS.has(name) ? '(hidden)' : formatValue(row[name]))).join(' | '))
  }
  lines.push('')
  return lines.join('\n')
}

async function main() {
  const { rows: tableRows } = await pool.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
  )
  const tables = tableRows.map((row) => row.tablename)

  const sections = [
    `# Supabase(Postgres) 덤프`,
    `생성 시각: ${new Date().toISOString()}`,
    `테이블 수: ${tables.length}`,
    '',
    ...(await Promise.all(tables.map(dumpTable))),
  ]

  fs.writeFileSync(OUTPUT_PATH, sections.join('\n'), 'utf-8')
  console.log(`written: ${OUTPUT_PATH.pathname} (tables: ${tables.join(', ')})`)
  await pool.end()
}

main()
