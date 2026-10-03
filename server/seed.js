// habitat/species/mission_definition 고정 기준 데이터를 채운다. 프론트 데이터 파일(src/data/*.js)을
// 그대로 import해서 쓰기 때문에 그 파일들이 바뀌어도 다시 실행하기만 하면 된다(멱등 — 전부
// ON CONFLICT DO UPDATE). 서버는 시작할 때 seedReferenceDataIfNeeded()로 완전히 빈 새 DB만 자동으로
// 채우고, 데이터 파일을 고친 내용을 반영하려면 node scripts/seed-supabase.js를 실행한다.
import { pool } from './db.js'
import { HABITATS, INSECT_SPECIES } from '../src/data/insectSpecies.js'
import { DAILY_MISSION_CANDIDATES } from '../src/data/dailyMissions.js'
import { WEEKLY_MISSION_CANDIDATES } from '../src/data/weeklyMissions.js'
import { ACHIEVEMENT_MISSIONS } from '../src/data/achievementMissions.js'
import { TITLE_MISSIONS } from '../src/data/titles.js'

const DAILY_REWARD_LEAF = 50 // dailyMissions.js의 createDailyMissions()가 매기는 고정값
const WEEKLY_REWARD_LEAF = 100 // weeklyMissions.js의 createWeeklyMissions()가 매기는 고정값
const ACHIEVEMENT_REWARD_LEAF = 0 // achievementMissions.js는 나뭇잎이 아니라 배지가 보상

const MISSION_TOTAL = DAILY_MISSION_CANDIDATES.length + WEEKLY_MISSION_CANDIDATES.length + ACHIEVEMENT_MISSIONS.length + TITLE_MISSIONS.length

async function seedHabitats(db) {
  const idByCode = {}
  for (const habitat of HABITATS) {
    const { rows } = await db.query(
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

async function seedSpecies(db, habitatIdByCode) {
  for (const species of INSECT_SPECIES) {
    const habitatId = habitatIdByCode[species.habitatId]
    if (!habitatId) throw new Error(`species ${species.id}(${species.name})의 habitatId '${species.habitatId}'가 habitat 테이블에 없음`)
    // id를 명시적으로 그대로 넣는다 — photos[speciesId] 등 앱 전체가 이 숫자를 그대로 참조하므로
    // auto-increment로 다시 매기면 안 된다(원본 데이터가 17번을 건너뛰어 1~16,18~80으로 79개).
    await db.query(
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
  await db.query(`SELECT setval(pg_get_serial_sequence('species', 'id'), (SELECT MAX(id) FROM species))`)
  console.log(`[seed] species: ${INSECT_SPECIES.length}행`)
}

async function upsertMissionDefinition(db, row) {
  await db.query(
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

async function seedMissionDefinitions(db) {
  for (const m of DAILY_MISSION_CANDIDATES) {
    await upsertMissionDefinition(db, {
      code: m.id, type: 'daily', title: m.title, description: m.desc,
      eventKey: m.event, goal: 1, rewardLeaf: DAILY_REWARD_LEAF,
    })
  }
  for (const m of WEEKLY_MISSION_CANDIDATES) {
    await upsertMissionDefinition(db, {
      code: m.id, type: 'weekly', title: m.title, description: m.desc,
      eventKey: m.event, goal: m.total, rewardLeaf: WEEKLY_REWARD_LEAF,
      permanent: Boolean(m.permanent), distinctTracking: Boolean(m.distinct),
    })
  }
  for (const m of ACHIEVEMENT_MISSIONS) {
    await upsertMissionDefinition(db, {
      code: m.id, type: 'achievement', title: m.title, description: m.desc,
      eventKey: m.event, goal: m.goal, rewardLeaf: ACHIEVEMENT_REWARD_LEAF, badgeName: m.badgeName,
    })
  }
  for (const m of TITLE_MISSIONS) {
    await upsertMissionDefinition(db, {
      code: m.id, type: 'title', title: m.title, description: m.desc,
      eventKey: m.counter, goal: m.goal, rewardLeaf: m.rewardLeaf, titleText: m.title,
    })
  }
  console.log(`[seed] mission_definition: ${MISSION_TOTAL}행 (daily ${DAILY_MISSION_CANDIDATES.length} + weekly ${WEEKLY_MISSION_CANDIDATES.length} + achievement ${ACHIEVEMENT_MISSIONS.length} + title ${TITLE_MISSIONS.length})`)
}

// 한 트랜잭션으로 채운다 — 중간에 연결이 끊겨도 반쯤 채워진 상태로 남지 않는다.
export async function seedReferenceData() {
  const client = await pool.connect()
  let releaseError
  try {
    await client.query('BEGIN')
    const habitatIdByCode = await seedHabitats(client)
    await seedSpecies(client, habitatIdByCode)
    await seedMissionDefinitions(client)
    await client.query('COMMIT')
  } catch (err) {
    releaseError = err
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release(releaseError)
  }
}

// 새 Supabase 프로젝트처럼 기준 데이터 테이블이 완전히 비어 있을 때만 자동으로 채운다. 이미 들어 있으면
// 건드리지 않는다 — 로컬에서 같은 DB에 붙여 npm run dev를 띄울 때 작업 중인 데이터 파일 내용이 운영 DB를
// 덮어쓰지 않게 하기 위해서다. 데이터 파일을 고쳤으면 node scripts/seed-supabase.js로 직접 반영한다.
export async function seedReferenceDataIfNeeded() {
  const { rows } = await pool.query(
    `SELECT (SELECT count(*) FROM habitat)::int AS habitats,
            (SELECT count(*) FROM species)::int AS species,
            (SELECT count(*) FROM mission_definition)::int AS missions`
  )
  const counts = rows[0]
  if (counts.habitats === 0 && counts.species === 0 && counts.missions === 0) {
    console.log('[seed] 빈 DB — 기준 데이터(서식지/종/미션)를 채우는 중')
    await seedReferenceData()
    return
  }
  if (counts.habitats < HABITATS.length || counts.species < INSECT_SPECIES.length || counts.missions < MISSION_TOTAL) {
    console.error(`[seed] 기준 데이터가 데이터 파일보다 적음(habitat ${counts.habitats}/${HABITATS.length}, species ${counts.species}/${INSECT_SPECIES.length}, mission ${counts.missions}/${MISSION_TOTAL}) — node scripts/seed-supabase.js로 채우세요`)
  }
}
