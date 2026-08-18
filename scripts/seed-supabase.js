// habitat/species/mission_definition 고정 시드 데이터를 채운다. 프론트 데이터 파일
// (src/data/*.js)을 그대로 import해서 쓰기 때문에 그 파일들이 바뀌어도 이 스크립트를
// 다시 실행하기만 하면 된다(멱등 — 전부 ON CONFLICT DO UPDATE).
// 실행: node scripts/seed-supabase.js
import 'dotenv/config'
import { pool, dbReady } from '../server/db.js'
import { HABITATS, INSECT_SPECIES } from '../src/data/insectSpecies.js'
import { DAILY_MISSION_CANDIDATES } from '../src/data/dailyMissions.js'
import { WEEKLY_MISSION_CANDIDATES } from '../src/data/weeklyMissions.js'
import { ACHIEVEMENT_MISSIONS } from '../src/data/achievementMissions.js'
import { TITLE_MISSIONS } from '../src/data/titles.js'

const DAILY_REWARD_LEAF = 50 // dailyMissions.js의 createDailyMissions()가 매기는 고정값
const WEEKLY_REWARD_LEAF = 100 // weeklyMissions.js의 createWeeklyMissions()가 매기는 고정값
const ACHIEVEMENT_REWARD_LEAF = 0 // achievementMissions.js는 나뭇잎이 아니라 배지가 보상

async function seedHabitats() {
  const idByCode = {}
  for (const habitat of HABITATS) {
    const { rows } = await pool.query(
      `INSERT INTO habitat (code, name)
       VALUES ($1, $2)
       ON CONFLICT (code) DO UPDATE SET name = excluded.name
       RETURNING id`,
      [habitat.id, habitat.name],
    )
    idByCode[habitat.id] = rows[0].id
  }
  console.log(`[seed] habitat: ${HABITATS.length}행`)
  return idByCode
}

async function seedSpecies(habitatIdByCode) {
  for (const species of INSECT_SPECIES) {
    const habitatId = habitatIdByCode[species.habitatId]
    if (!habitatId) throw new Error(`species ${species.id}(${species.name})의 habitatId '${species.habitatId}'가 habitat 테이블에 없음`)
    // id를 명시적으로 그대로 넣는다 — photos[speciesId] 등 앱 전체가 이 숫자를 그대로 참조하므로
    // auto-increment로 다시 매기면 안 된다(원본 데이터가 17번을 건너뛰어 1~16,18~80으로 79개).
    await pool.query(
      `INSERT INTO species (id, habitat_id, name, scientific_name, feature, image_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         habitat_id = excluded.habitat_id,
         name = excluded.name,
         scientific_name = excluded.scientific_name,
         feature = excluded.feature,
         image_url = excluded.image_url`,
      [species.id, habitatId, species.name, species.scientificName ?? null, species.feature ?? null, species.image],
    )
  }
  // 다음 species가 생기면(auto-increment를 실제로 쓸 일은 없지만) 기존 최대 id와 안 겹치게 시퀀스를 맞춰둔다.
  await pool.query(`SELECT setval(pg_get_serial_sequence('species', 'id'), (SELECT MAX(id) FROM species))`)
  console.log(`[seed] species: ${INSECT_SPECIES.length}행`)
}

async function upsertMissionDefinition(row) {
  await pool.query(
    `INSERT INTO mission_definition (code, type, title, description, event_key, goal, reward_leaf, badge_name, title_text, permanent, distinct_tracking)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (code) DO UPDATE SET
       type = excluded.type,
       title = excluded.title,
       description = excluded.description,
       event_key = excluded.event_key,
       goal = excluded.goal,
       reward_leaf = excluded.reward_leaf,
       badge_name = excluded.badge_name,
       title_text = excluded.title_text,
       permanent = excluded.permanent,
       distinct_tracking = excluded.distinct_tracking`,
    [row.code, row.type, row.title, row.description, row.eventKey ?? null, row.goal, row.rewardLeaf, row.badgeName ?? null, row.titleText ?? null, row.permanent ?? false, row.distinctTracking ?? false],
  )
}

async function seedMissionDefinitions() {
  for (const m of DAILY_MISSION_CANDIDATES) {
    await upsertMissionDefinition({
      code: m.id, type: 'daily', title: m.title, description: m.desc,
      eventKey: m.event, goal: 1, rewardLeaf: DAILY_REWARD_LEAF,
    })
  }
  for (const m of WEEKLY_MISSION_CANDIDATES) {
    await upsertMissionDefinition({
      code: m.id, type: 'weekly', title: m.title, description: m.desc,
      eventKey: m.event, goal: m.total, rewardLeaf: WEEKLY_REWARD_LEAF,
      permanent: Boolean(m.permanent), distinctTracking: Boolean(m.distinct),
    })
  }
  for (const m of ACHIEVEMENT_MISSIONS) {
    await upsertMissionDefinition({
      code: m.id, type: 'achievement', title: m.title, description: m.desc,
      eventKey: m.event, goal: m.goal, rewardLeaf: ACHIEVEMENT_REWARD_LEAF, badgeName: m.badgeName,
    })
  }
  for (const m of TITLE_MISSIONS) {
    await upsertMissionDefinition({
      code: m.id, type: 'title', title: m.title, description: m.desc,
      eventKey: m.counter, goal: m.goal, rewardLeaf: m.rewardLeaf, titleText: m.title,
    })
  }
  const total = DAILY_MISSION_CANDIDATES.length + WEEKLY_MISSION_CANDIDATES.length + ACHIEVEMENT_MISSIONS.length + TITLE_MISSIONS.length
  console.log(`[seed] mission_definition: ${total}행 (daily ${DAILY_MISSION_CANDIDATES.length} + weekly ${WEEKLY_MISSION_CANDIDATES.length} + achievement ${ACHIEVEMENT_MISSIONS.length} + title ${TITLE_MISSIONS.length})`)
}

async function main() {
  await dbReady
  const habitatIdByCode = await seedHabitats()
  await seedSpecies(habitatIdByCode)
  await seedMissionDefinitions()
  await pool.end()
  console.log('[seed] 완료')
}

main().catch((err) => {
  console.error('[seed] 실패:', err)
  process.exitCode = 1
})
