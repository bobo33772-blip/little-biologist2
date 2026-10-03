import crypto from 'node:crypto'
import fs from 'node:fs'
import pg from 'pg'

const { Pool } = pg

// Supabase Session pooler를 쓴다 — 계속 떠 있는 Express 서버에 맞고, 모든 쿼리가 비동기다.
if (!process.env.DATABASE_URL) {
  console.error('[db] DATABASE_URL이 비어 있음 — .env 또는 Render > Environment를 확인하세요')
}

// Supabase로 가는 연결은 TLS로 암호화하고, Supabase 공개 루트 인증서(supabase-ca.crt, 2031년 만료)로
// 상대 서버를 검증한다. 이 인증서는 Node 기본 인증서 목록에 없어서, URL에 ?sslmode=require를 붙이면
// 오히려 "self-signed certificate in certificate chain"으로 실패한다 — 그래서 URL에는 아무것도 붙이지
// 않고 여기서 켠다. 로컬 Postgres처럼 Supabase가 아닌 주소는 건드리지 않는다.
function sslOptionFor(connectionString) {
  let host
  try {
    host = new URL(connectionString).hostname
  } catch {
    return undefined
  }
  if (!/\.supabase\.(com|co)$/.test(host)) return undefined
  return { ca: fs.readFileSync(new URL('./supabase-ca.crt', import.meta.url), 'utf8') }
}
// 타임아웃이 없으면 DB가 응답하지 않을 때(Supabase 프로젝트 일시정지 등) 서버 부팅과 요청이
// 끝없이 매달린다. 연결/쿼리에 상한을 둬서 실패를 빨리 드러내고 503으로 응답할 수 있게 한다.
// query_timeout은 사진(base64)이 많은 계정의 진행도 조회도 견디도록 넉넉하게 두되, Vercel
// 프록시 한도(120초)보다는 짧게 잡는다.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslOptionFor(process.env.DATABASE_URL),
  connectionTimeoutMillis: 15000,
  query_timeout: 60000,
  keepAlive: true,
})

// pg.Pool은 유휴 커넥션이 네트워크 문제로 끊기면 'error' 이벤트를 낸다. 리스너가 없으면
// Node가 이걸 uncaught exception으로 취급해서 서버 프로세스 전체가 죽는다 — 일시적인
// 네트워크 끊김 한 번에 로그인/친구요청 등 전부 응답 불가 상태가 됐던 원인.
pool.on('error', (err) => {
  console.error('[db] idle client error (server가 계속 떠 있도록 무시함):', err.message)
})

// "Little Biologist ERD (재설계)"를 실제 DB에 적용한 스키마. user_state 하나에 계정 진행도를
// 전부 JSON으로 몰아넣던 예전 방식을 버리고, 실제 쓰이는 개념(도감 등록/미션/친구 등) 단위로
// 정규화했다. 딱 하나 예외: bagItems/placements는 여전히 user_state에 남겨둔다 — Shop.jsx가
// 애초에 서버가 아니라 정적 mockData를 직접 쓰고 있어 상점 카탈로그 테이블을 지금 연결해도
// 아무도 안 읽고, 배치(placements)는 클라이언트가 서버 응답을 기다리지 않고 즉석에서 id를
//만들어 바로 쓰는 방식이라 서버가 id를 발급하는 정규화 테이블과 안 맞는다(scripts/seed-supabase.js
// 주석 참고). shop_item/bag_item/ranch_placement/gacha_pull/purchase_history는 나중에
// Shop.jsx를 실제 서버 연동으로 바꿀 때를 위한 뼈대로만 만들어두고, 이번엔 시딩도 배선도 안 한다.
export async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id                BIGSERIAL PRIMARY KEY,
      uid               VARCHAR(20) NOT NULL UNIQUE,
      username          VARCHAR(50) NOT NULL UNIQUE,
      password_hash     VARCHAR(255) NOT NULL,
      nickname          VARCHAR(50) NOT NULL,
      bio               VARCHAR(60),
      leaves            INTEGER NOT NULL DEFAULT 0,
      growth_points     INTEGER NOT NULL DEFAULT 0,
      bag_capacity      INTEGER NOT NULL DEFAULT 30,
      total_login_days  INTEGER NOT NULL DEFAULT 1,
      last_login_date   VARCHAR(10),
      created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS habitat (
      id           BIGSERIAL PRIMARY KEY,
      code         VARCHAR(30) NOT NULL UNIQUE,
      name         VARCHAR(50) NOT NULL,
      description  VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS species (
      id               BIGINT PRIMARY KEY,
      habitat_id       BIGINT NOT NULL REFERENCES habitat(id),
      name             VARCHAR(100) NOT NULL,
      scientific_name  VARCHAR(150),
      feature          TEXT,
      image_url        VARCHAR(255) NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_species_habitat ON species(habitat_id);

    -- species_id: 성체가 됐을 때 고정되는 실제 도감 종 id(문자열로 저장). larva_category:
    -- 유충 단계에서 어떤 유충 원화(public/representative-character/larva/*.png, 17종류)를
    -- 쓸지 — 성체가 될 때 이 값에 맞는 도감 종 중 하나가 species_id로 뽑혀 고정된다.
    CREATE TABLE IF NOT EXISTS representative_character (
      id             BIGSERIAL PRIMARY KEY,
      user_id        BIGINT NOT NULL UNIQUE REFERENCES users(id),
      species_index  INTEGER NOT NULL,
      stage          VARCHAR(20) NOT NULL DEFAULT 'egg',
      larva_category VARCHAR(30),
      species_id     TEXT,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ALTER TABLE representative_character ADD COLUMN IF NOT EXISTS larva_category VARCHAR(30);
    ALTER TABLE representative_character ADD COLUMN IF NOT EXISTS species_id TEXT;

    CREATE TABLE IF NOT EXISTS user_habitat_layout (
      user_id     BIGINT NOT NULL REFERENCES users(id),
      habitat_id  BIGINT NOT NULL REFERENCES habitat(id),
      pos_x       REAL NOT NULL,
      pos_y       REAL NOT NULL,
      scale       REAL NOT NULL DEFAULT 1,
      PRIMARY KEY (user_id, habitat_id)
    );

    -- 금(사진)/은(그림)/동(랜덤곤충) 등급은 photo_url/sketch_url/bronze_unlocked 존재 여부로 판단한다.
    CREATE TABLE IF NOT EXISTS user_species_record (
      user_id               BIGINT NOT NULL REFERENCES users(id),
      species_id            BIGINT NOT NULL REFERENCES species(id),
      bronze_unlocked       BOOLEAN NOT NULL DEFAULT false,
      photo_url             TEXT,
      sketch_url            TEXT,
      first_registered_at   VARCHAR(10) NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD'),
      PRIMARY KEY (user_id, species_id)
    );

    CREATE INDEX IF NOT EXISTS idx_user_species_record_user ON user_species_record(user_id);

    -- daily/weekly/achievement/title/event 공용 미션 마스터(고정 시드 데이터, scripts/seed-supabase.js).
    -- code는 dailyMissions.js 등 프론트 데이터 파일의 문자열 id를 그대로 담는다 — 앱 전체가
    -- 미션을 이 문자열로만 참조하기 때문에 숫자 PK만으로는 클라이언트 요청을 못 알아본다.
    CREATE TABLE IF NOT EXISTS mission_definition (
      id                 BIGSERIAL PRIMARY KEY,
      code               VARCHAR(40) NOT NULL UNIQUE,
      type               VARCHAR(20) NOT NULL CHECK (type IN ('daily', 'weekly', 'achievement', 'title', 'event')),
      title              VARCHAR(100) NOT NULL,
      description        VARCHAR(255) NOT NULL,
      event_key          VARCHAR(50),
      goal               INTEGER NOT NULL,
      reward_leaf        INTEGER NOT NULL DEFAULT 0,
      badge_name         VARCHAR(100),
      title_text         VARCHAR(50),
      permanent          BOOLEAN NOT NULL DEFAULT false,
      distinct_tracking  BOOLEAN NOT NULL DEFAULT false
    );

    CREATE INDEX IF NOT EXISTS idx_mission_definition_type ON mission_definition(type);

    -- 업적/칭호 중 계정마다 무작위 12개를 골라 고정해두는 표(daily/weekly는 후보가 적어서
    -- 매번 새로 뽑고 이 표를 쓰지 않는다).
    CREATE TABLE IF NOT EXISTS user_mission_pool (
      user_id                BIGINT NOT NULL REFERENCES users(id),
      mission_definition_id  BIGINT NOT NULL REFERENCES mission_definition(id),
      PRIMARY KEY (user_id, mission_definition_id)
    );

    -- period_key: 일일=날짜('2026-08-06'), 주간=주차 시작일, 업적/칭호=''(계정당 한 번만 진행).
    CREATE TABLE IF NOT EXISTS user_mission_progress (
      user_id                BIGINT NOT NULL REFERENCES users(id),
      mission_definition_id  BIGINT NOT NULL REFERENCES mission_definition(id),
      period_key             VARCHAR(20) NOT NULL DEFAULT '',
      progress               INTEGER NOT NULL DEFAULT 0,
      total                  INTEGER NOT NULL DEFAULT 0,
      done                   BOOLEAN NOT NULL DEFAULT false,
      claimed                BOOLEAN NOT NULL DEFAULT false,
      claimed_at             TIMESTAMPTZ,
      is_equipped            BOOLEAN NOT NULL DEFAULT false,
      equip_order            SMALLINT,
      seen_ids               INTEGER[],
      PRIMARY KEY (user_id, mission_definition_id, period_key)
    );

    CREATE INDEX IF NOT EXISTS idx_user_mission_progress_user ON user_mission_progress(user_id);

    -- achievementProgress의 정수 카운터 7개(explorations, friendVisits 등). 배열형 카운터
    -- (드로잉/사진/등록종/올랭크종)는 user_species_record에서 그때그때 계산하므로 여기 없다.
    CREATE TABLE IF NOT EXISTS user_progress_counter (
      user_id      BIGINT NOT NULL REFERENCES users(id),
      counter_key  VARCHAR(30) NOT NULL,
      value        INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, counter_key)
    );

    CREATE TABLE IF NOT EXISTS friend_request (
      id            BIGSERIAL PRIMARY KEY,
      requester_id  BIGINT NOT NULL REFERENCES users(id),
      target_id     BIGINT NOT NULL REFERENCES users(id),
      status        VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (requester_id, target_id)
    );

    CREATE INDEX IF NOT EXISTS idx_friend_request_target ON friend_request(target_id, status);

    CREATE TABLE IF NOT EXISTS friendship (
      user_id     BIGINT NOT NULL REFERENCES users(id),
      friend_id   BIGINT NOT NULL REFERENCES users(id),
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, friend_id)
    );

    CREATE TABLE IF NOT EXISTS guestbook (
      id              BIGSERIAL PRIMARY KEY,
      ranch_owner_id  BIGINT NOT NULL REFERENCES users(id),
      visitor_id      BIGINT NOT NULL REFERENCES users(id),
      message         TEXT NOT NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_guestbook_owner ON guestbook(ranch_owner_id);

    -- bagItems/placements 전용으로 범위를 좁힌 예전 방식의 잔존 key-value 저장소 (위 주석 참고).
    CREATE TABLE IF NOT EXISTS user_state (
      user_id     BIGINT NOT NULL REFERENCES users(id),
      key         TEXT NOT NULL,
      value       TEXT NOT NULL,
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, key)
    );

    -- 아래 5개는 Shop.jsx가 실제로 서버와 통신하게 될 다음 단계를 위한 뼈대 — 지금은 시딩도
    -- 배선도 하지 않는다.
    CREATE TABLE IF NOT EXISTS shop_item (
      id           BIGSERIAL PRIMARY KEY,
      category     VARCHAR(20) NOT NULL CHECK (category IN ('recommend', 'interior')),
      theme        VARCHAR(20) CHECK (theme IN ('basic', 'winter', 'sea')),
      name         VARCHAR(100) NOT NULL,
      description  VARCHAR(255),
      price_leaf   INTEGER NOT NULL,
      image_url    VARCHAR(255) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bag_item (
      user_id       BIGINT NOT NULL REFERENCES users(id),
      shop_item_id  BIGINT NOT NULL REFERENCES shop_item(id),
      quantity      INTEGER NOT NULL DEFAULT 1,
      placed_count  INTEGER NOT NULL DEFAULT 0,
      acquired_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, shop_item_id)
    );

    CREATE TABLE IF NOT EXISTS ranch_placement (
      id            BIGSERIAL PRIMARY KEY,
      user_id       BIGINT NOT NULL REFERENCES users(id),
      shop_item_id  BIGINT NOT NULL REFERENCES shop_item(id),
      pos_x         REAL NOT NULL,
      pos_y         REAL NOT NULL,
      scale         REAL NOT NULL DEFAULT 1,
      placed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS gacha_pull (
      id            BIGSERIAL PRIMARY KEY,
      user_id       BIGINT NOT NULL REFERENCES users(id),
      shop_item_id  BIGINT NOT NULL REFERENCES shop_item(id),
      pulled_at     TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS purchase_history (
      id            BIGSERIAL PRIMARY KEY,
      user_id       BIGINT NOT NULL REFERENCES users(id),
      shop_item_id  BIGINT NOT NULL REFERENCES shop_item(id),
      price_leaf    INTEGER NOT NULL,
      purchased_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Supabase는 public 스키마의 테이블을 REST API(Data API)로 그대로 노출한다 — RLS가 꺼져 있으면
    -- anon 키만 있으면 누구나 users(비밀번호 해시 포함)를 읽고 쓸 수 있다. 이 앱은 Data API를 안 쓰고
    -- 서버가 테이블 소유자(postgres)로 직접 접속하므로(소유자는 RLS를 안 받음), 정책 없이 RLS만 켜서
    -- Data API 쪽 접근을 전부 막는다. 이미 켜진 테이블은 건드리지 않는다.
    DO $$
    DECLARE t text;
    BEGIN
      FOR t IN
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public' AND NOT rowsecurity AND tablename = ANY (ARRAY[
          'users', 'habitat', 'species', 'representative_character', 'user_habitat_layout',
          'user_species_record', 'mission_definition', 'user_mission_pool', 'user_mission_progress',
          'user_progress_counter', 'friend_request', 'friendship', 'guestbook', 'user_state',
          'shop_item', 'bag_item', 'ranch_placement', 'gacha_pull', 'purchase_history'
        ])
      LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      END LOOP;
    END $$;
  `)
}

// 예전에는 import 시점에 initSchema()를 한 번만 실행하고, 실패하면 index.js가 process.exit(1)로
// 서버를 끝내버렸다. 그래서 Supabase 무료 프로젝트가 장기 미사용으로 일시정지되자 Render가 깨울
// 때마다 서버가 포트를 열기도 전에 죽어서, DB와 상관없는 화면까지 전부 무응답이 됐다(로그인 불가의
// 원인). 이제 서버는 먼저 포트를 열고, 스키마 준비는 성공할 때까지 백그라운드에서 재시도한다.
let dbReady = false
let markDbReady
const dbReadyPromise = new Promise((resolve) => {
  markDbReady = resolve
})

export function isDbReady() {
  return dbReady
}

// 준비될 때까지 최대 ms만큼 기다린다. Render가 잠든 서버를 깨우는 동안 붙잡아 둔 첫 로그인 요청은
// 포트가 열리자마자 들어오는데, 그 순간엔 아직 스키마 준비(DB 첫 연결)가 끝나지 않았을 수 있다 —
// 바로 503을 주지 않고 잠깐 기다려서 첫 로그인이 실패하지 않게 한다.
export function waitForDbReady(ms) {
  if (dbReady) return Promise.resolve(true)
  return Promise.race([
    dbReadyPromise.then(() => true),
    new Promise((resolve) => setTimeout(() => resolve(false), ms)),
  ])
}

function setDbReady() {
  dbReady = true
  markDbReady()
}

async function usersTableExists() {
  const { rows } = await pool.query("SELECT to_regclass('public.users') IS NOT NULL AS ok")
  return rows[0]?.ok === true
}

// DB에 연결할 수 없을 때 pg/네트워크가 내는 에러들 — 서버 버그가 아니라 "잠시 후 다시" 상황이다.
const DB_UNAVAILABLE_CODES = new Set([
  'ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN',
  '08000', '08001', '08003', '08004', '08006', '25006', '28P01', '53300', '57P01', '57P03', 'XX000',
])

export function isDbUnavailableError(err) {
  return DB_UNAVAILABLE_CODES.has(err?.code) || /timeout|Connection terminated|not queryable|tenant or user not found|max client/i.test(err?.message || '')
}

// afterInit: 스키마가 준비된 직후, DB 라우트를 열기 전에 실행할 작업(기준 데이터 시드 등).
export async function initSchemaWithRetry(afterInit) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      await initSchema()
      if (afterInit) {
        try {
          await afterInit()
        } catch (err) {
          // 연결 문제면 처음부터 다시 시도한다. 그 밖의 실패(데이터 파일의 잘못된 값 등)는 재시도해도
          // 똑같이 실패하므로, 크게 로그만 남기고 DB 라우트는 연다 — 기준 데이터 때문에 로그인까지 막히면 안 된다.
          if (isDbUnavailableError(err)) throw err
          console.error('[seed] 기준 데이터 채우기 실패 — src/data 파일을 확인하세요:', err.code || '', err.message)
        }
      }
      setDbReady()
      console.log('[db] schema ready')
      return
    } catch (err) {
      // 25006 = Supabase 무료 용량(500MB) 초과로 DB가 읽기 전용이 된 상태. CREATE TABLE만 막히고
      // 조회는 되므로, 테이블이 이미 있으면 준비된 것으로 보고 계속 간다(로그인 등 읽기는 가능).
      if (err.code === '25006' && (await usersTableExists().catch(() => false))) {
        setDbReady()
        console.error('[db] DB가 읽기 전용 모드 — Supabase 대시보드에서 DB 용량을 확인하세요')
        return
      }
      // Render 로그에서 원인을 바로 알 수 있게 코드와 메시지를 같이 남긴다
      // (예: "Tenant or user not found" = 일시정지/잘못된 프로젝트, 28P01 = 비밀번호 불일치).
      console.error(`[db] schema init failed (attempt ${attempt}):`, err.code || '', err.message)
      await new Promise((resolve) => setTimeout(resolve, Math.min(30000, 2000 * attempt)))
    }
  }
}

// uid는 계정당 최초 1회만 발급되고 이후 고정된다 (친구 추가용 공개 식별자).
export function generateUid() {
  return crypto.randomBytes(4).toString('hex')
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':')
  const candidate = crypto.scryptSync(password, salt, 64)
  const storedBuf = Buffer.from(hash, 'hex')
  if (candidate.length !== storedBuf.length) return false
  return crypto.timingSafeEqual(candidate, storedBuf)
}
