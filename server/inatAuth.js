import crypto from 'node:crypto'

// iNaturalist 컴퓨터 비전 API(score_image)에 쓰는 JWT(api_token)는 24시간마다 만료된다. 예전에는
// 이 JWT를 매일 손으로 복사해 INATURALIST_JWT에 넣어야 했다. iNaturalist OAuth 앱으로 받은 액세스
// 토큰(만료 없음)이 있으면, 서버가 만료 1시간 전에 /users/api_token에서 새 JWT를 알아서 받아온다.
// 공식 권장 방식: https://www.inaturalist.org/pages/api+recommended+practices
//
// 설정(환경변수) — 위에서부터 우선:
//   INAT_OAUTH_ACCESS_TOKEN                      권장. scripts/inat-get-token.mjs로 한 번 받아서 넣는다.
//   INAT_APP_ID + INAT_APP_SECRET + INAT_USERNAME + INAT_PASSWORD
//                                                서버가 직접 비밀번호로 액세스 토큰을 받는다(비권장).
//   INATURALIST_JWT                              예전 방식(수동 복사). 위 설정이 없을 때만 쓴다.
const OAUTH_TOKEN_URL = 'https://www.inaturalist.org/oauth/token'
const API_TOKEN_URL = 'https://www.inaturalist.org/users/api_token.json'
const REFRESH_BEFORE_EXPIRY_MS = 60 * 60 * 1000
const FAILURE_COOLDOWN_MS = 60 * 1000
const REQUEST_TIMEOUT_MS = 15000
const RETRY_DELAYS_MS = [1000, 2000, 4000]

export const INAT_USER_AGENT = process.env.INAT_USER_AGENT || 'LittleBiologist/1.0'

const ACCESS_TOKEN = stripBearer(process.env.INAT_OAUTH_ACCESS_TOKEN)
const APP_ID = process.env.INAT_APP_ID
const APP_SECRET = process.env.INAT_APP_SECRET
const USERNAME = process.env.INAT_USERNAME
const PASSWORD = process.env.INAT_PASSWORD
const STATIC_JWT = stripBearer(process.env.INATURALIST_JWT)

const canUsePasswordGrant = Boolean(APP_ID && APP_SECRET && USERNAME && PASSWORD)
export const canAutoRefreshInatJwt = Boolean(ACCESS_TOKEN) || canUsePasswordGrant
export const hasInatAuthConfig = canAutoRefreshInatJwt || Boolean(STATIC_JWT)

// 액세스 토큰/비밀번호가 틀렸거나 취소된 경우 — 재시도해도 소용없다.
class InatAuthError extends Error {}

function stripBearer(value) {
  return (value || '').trim().replace(/^Bearer\s+/i, '') || null
}

// JWT의 exp(초)를 읽는다. 서명 검증은 iNaturalist가 하므로 여기서는 만료 시각만 본다.
function readJwtExpiryMs(jwt) {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString('utf8'))
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

// 로그에 토큰 원문을 남기지 않고도 어떤 토큰인지 구분할 수 있게 해시 앞 8자리만 쓴다.
function fingerprint(token) {
  return crypto.createHash('sha256').update(token).digest('hex').slice(0, 8)
}

// 자동 갱신 설정이 있으면 손으로 넣은 INATURALIST_JWT는 쓰지 않는다 — 섞어 쓰면 잘못 넣은 액세스
// 토큰이 그 JWT가 만료될 때(최대 하루 뒤)까지 드러나지 않는다.
let cached = STATIC_JWT && !canAutoRefreshInatJwt
  ? { jwt: STATIC_JWT, expMs: readJwtExpiryMs(STATIC_JWT) ?? Infinity, source: 'static' }
  : null
let passwordGrantAccessToken = null
let refreshing = null
let lastFailureAt = 0
let lastRefreshOk = null

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// 5xx/429/네트워크 오류는 잠깐 쉬었다 다시 시도한다(iNaturalist 쪽 연결 끊김이 종종 있었다).
async function fetchWithRetry(url, options) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      const response = await fetch(url, { ...options, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
      if (response.status < 500 && response.status !== 429) return response
      if (attempt >= RETRY_DELAYS_MS.length) return response
    } catch (error) {
      if (attempt >= RETRY_DELAYS_MS.length) throw error
    }
    await sleep(RETRY_DELAYS_MS[attempt])
  }
}

async function requestAccessTokenWithPassword() {
  const response = await fetchWithRetry(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json', 'User-Agent': INAT_USER_AGENT },
    body: new URLSearchParams({ client_id: APP_ID, client_secret: APP_SECRET, grant_type: 'password', username: USERNAME, password: PASSWORD }),
  })
  // 응답 본문에는 토큰이 들어 있으므로 실패해도 상태 코드만 남긴다.
  if (response.status === 400 || response.status === 401) throw new InatAuthError(`oauth/token HTTP ${response.status}`)
  if (!response.ok) throw new Error(`oauth/token HTTP ${response.status}`)
  const { access_token: accessToken } = await response.json()
  if (!accessToken) throw new Error('oauth/token 응답에 access_token 없음')
  return accessToken
}

async function mintJwt(accessToken) {
  const response = await fetchWithRetry(API_TOKEN_URL, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'User-Agent': INAT_USER_AGENT },
    redirect: 'manual',
  })
  if (response.status === 403 && response.headers.get('cf-mitigated')) {
    throw new Error('api_token이 Cloudflare에 막힘(서버 IP 차단 가능성)')
  }
  // 3xx는 로그인 페이지로 돌려보낸 것 — 액세스 토큰이 인증되지 않았다는 뜻이다.
  if (response.status === 401 || response.status === 403 || (response.status >= 300 && response.status < 400)) {
    throw new InatAuthError(`api_token HTTP ${response.status}`)
  }
  if (!response.ok) throw new Error(`api_token HTTP ${response.status}`)
  const { api_token: jwt } = await response.json()
  if (!jwt) throw new Error('api_token 응답에 api_token 없음')
  return jwt
}

async function refreshJwt() {
  let source = 'oauth'
  let accessToken = ACCESS_TOKEN
  if (!accessToken) {
    source = 'password'
    passwordGrantAccessToken ||= await requestAccessTokenWithPassword()
    accessToken = passwordGrantAccessToken
  }
  let jwt
  try {
    jwt = await mintJwt(accessToken)
  } catch (error) {
    // 액세스 토큰이 취소/만료됐는데 비밀번호 설정이 있으면 새 액세스 토큰으로 한 번 더 시도한다.
    if (!(error instanceof InatAuthError) || !canUsePasswordGrant) throw error
    source = 'password'
    passwordGrantAccessToken = await requestAccessTokenWithPassword()
    jwt = await mintJwt(passwordGrantAccessToken)
  }
  const expMs = readJwtExpiryMs(jwt) ?? Date.now() + 23 * 60 * 60 * 1000
  cached = { jwt, expMs, source }
  console.log(`[inat-auth] JWT 갱신(${source}) — 만료 ${new Date(expMs).toISOString()}, fp ${fingerprint(jwt)}`)
  return jwt
}

// score_image 호출에 쓸 JWT를 돌려준다. force는 iNaturalist가 401을 돌려줬을 때(만료/취소) 쓴다.
export async function getInatJwt({ force = false } = {}) {
  const now = Date.now()
  if (!canAutoRefreshInatJwt) return cached?.jwt ?? null
  if (!force && cached && cached.expMs - now > REFRESH_BEFORE_EXPIRY_MS) return cached.jwt
  // 방금 갱신에 실패했으면 잠깐은 다시 시도하지 않는다 — 사진 요청마다 iNaturalist를 두드리지 않게.
  if (now - lastFailureAt < FAILURE_COOLDOWN_MS) {
    if (cached && cached.expMs > now) return cached.jwt
    throw new Error('최근 JWT 갱신 실패 — 잠시 후 다시 시도')
  }
  refreshing ||= refreshJwt().finally(() => {
    refreshing = null
  })
  try {
    const jwt = await refreshing
    lastRefreshOk = true
    return jwt
  } catch (error) {
    lastRefreshOk = false
    lastFailureAt = Date.now()
    console.error('[inat-auth] JWT 갱신 실패:', error.message)
    // 갱신은 실패했지만 기존 JWT가 아직 살아 있으면 그거라도 쓴다.
    if (cached && cached.expMs > Date.now()) return cached.jwt
    throw error
  }
}

// /api/health에서 보여줄 상태 — 토큰 값은 절대 포함하지 않는다.
export function getInatAuthStatus() {
  const mode = ACCESS_TOKEN ? 'oauth' : canUsePasswordGrant ? 'password' : STATIC_JWT ? 'static' : 'none'
  const expiresAt = cached && Number.isFinite(cached.expMs) ? new Date(cached.expMs).toISOString() : null
  // lastRefreshOk: 마지막 자동 갱신 결과(아직 안 했으면 null) — 액세스 토큰이 제대로 들어갔는지 확인하는 용도.
  return { mode, expiresAt, lastRefreshOk }
}
