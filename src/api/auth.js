import { apiUrl } from './base'

// 로그인/회원가입 요청 공통 처리. Render 무료 서버는 한동안 안 쓰면 잠들어서 첫 요청에 1분 가까이
// 걸리고, 서버나 DB가 아예 죽어 있으면 Vercel 프록시가 2분을 꽉 채운 뒤 502를 돌려준다. 그 전에
// 요청을 끊고, 응답 상태를 그대로 돌려줘서 화면이 "비밀번호 틀림"과 "서버 문제"를 구분해 안내하게 한다.
const REQUEST_TIMEOUT_MS = 100000

// 반환값 status: HTTP 상태 코드(숫자), 또는 'timeout' / 'network'.
export async function postAuth(path, body) {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(apiUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    // Vercel의 502/504 응답은 JSON이 아니므로 본문 파싱 실패는 빈 객체로 넘긴다.
    const data = await response.json().catch(() => ({}))
    return { ok: response.ok, status: response.status, data }
  } catch (error) {
    return { ok: false, status: error?.name === 'AbortError' ? 'timeout' : 'network', data: {} }
  } finally {
    window.clearTimeout(timer)
  }
}

// 로그인 화면이 열리자마자 서버를 미리 깨워둔다 — 아이디/비밀번호를 입력하는 동안 Render 서버가
// 깨어나고 DB까지 한 번 다녀오므로, 실제 로그인 버튼을 눌렀을 때 기다리는 시간이 줄어든다.
export function wakeServer() {
  fetch(apiUrl('/api/health')).catch(() => {})
}

// 로그인을 유지한 채 다시 들어왔을 때(특히 앱) 오늘 출석을 서버에 반영하고 최신 출석 일수를 돌려준다.
// 서버가 이 경로를 모르는 예전 버전이거나(404) 계정이 없으면 null. 서버가 잠깐 응답하지 못하면(5xx·네트워크)
// 예외를 던져서, 호출한 쪽이 다음에 화면이 다시 보일 때 재시도하게 한다.
export async function recordAttendance(uid) {
  const response = await fetch(apiUrl(`/api/users/${encodeURIComponent(uid)}/attendance`), { method: 'POST' })
  if (response.status >= 500) throw new Error(`ATTENDANCE_FAILED_${response.status}`)
  if (!response.ok) return null
  const data = await response.json().catch(() => ({}))
  return typeof data.totalLoginDays === 'number' ? data.totalLoginDays : null
}
