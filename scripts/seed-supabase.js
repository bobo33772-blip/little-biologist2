// habitat/species/mission_definition 고정 시드 데이터를 채운다(실제 내용은 server/seed.js).
// 서버가 시작할 때 비어 있으면 자동으로 채우므로 보통은 따로 실행할 필요가 없고, 데이터 파일을
// 고친 내용을 강제로 다시 반영하고 싶을 때만 실행한다(멱등 — 전부 ON CONFLICT DO UPDATE).
// 실행: node scripts/seed-supabase.js
import 'dotenv/config'
import { pool, initSchema } from '../server/db.js'
import { seedReferenceData } from '../server/seed.js'

async function main() {
  // 서버와 달리 시드는 재시도 없이 한 번만 시도한다 — DB에 못 붙으면 바로 실패를 보여주는 게 낫다.
  await initSchema()
  await seedReferenceData()
  await pool.end()
  console.log('[seed] 완료')
}

main().catch((err) => {
  console.error('[seed] 실패:', err)
  process.exitCode = 1
})
