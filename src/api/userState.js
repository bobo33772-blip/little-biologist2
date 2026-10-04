// 계정별 진행도(퀘스트/업적/도감등록/나뭇잎/목장배치 등)를 server/db.js의 user_state 테이블에
// 저장/조회하는 얇은 클라이언트. 키 하나가 기존에 각 Context가 쓰던 localStorage 키 하나에 대응한다.
import { forceRelogin } from '../router/AuthContext'
import { apiUrl } from './base'

// 서버가 막 깨어났거나 DB 연결이 잠깐 끊긴 경우를 넘기기 위한 재시도 간격.
const LOAD_RETRY_DELAYS_MS = [2000, 5000, 10000]

// 진행도를 끝내 못 불러온 계정. 이 상태에서 저장을 허용하면, 각 Context가 들고 있는 기본값(나뭇잎 0,
// 새로 뽑은 알 등)이 서버에 있는 진짜 진행도를 덮어써버린다 — 그래서 저장을 막고 다시 로그인시킨다.
const loadFailedUids = new Set()

// 로그인 직후 여러 Context가 동시에 진행도를 불러오는데, 각자 따로 요청하면 일부만 실패했을 때
// 성공한 쪽이 실패한 쪽의 기본값과 섞인 값을 저장해버린다. 같은 계정의 진행 중인 요청 하나를 같이
// 기다리게 해서 전부 함께 성공하거나 함께 실패하게 한다(끝나면 지워서 나중 화면은 새로 불러온다).
const inflightLoads = new Map()

function handleLoadFailure(uid) {
  loadFailedUids.add(uid)
  forceRelogin('state-load-failed', uid)
}

export async function fetchUserState(uid) {
  if (!uid) return {}
  if (!inflightLoads.has(uid)) {
    inflightLoads.set(uid, loadUserStateWithRetry(uid).finally(() => inflightLoads.delete(uid)))
  }
  // 각 Context가 받은 객체의 최상위 키를 바꿔도 서로 영향이 없도록 얕은 복사본을 준다.
  return { ...(await inflightLoads.get(uid)) }
}

async function loadUserStateWithRetry(uid) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      const response = await fetch(apiUrl(`/api/state/${uid}`))
      if (response.ok) {
        const { state } = await response.json()
        // 실패 후 같은 탭에서 다시 로그인해 새로 불러온 경우 — 이제 모든 Context가 진짜 값을 가지므로 저장을 다시 허용한다.
        loadFailedUids.delete(uid)
        return state || {}
      }
      // 404(계정 없음)처럼 다시 시도해도 소용없는 응답은 바로 실패로 처리한다.
      if (response.status < 500) break
    } catch {
      // 네트워크 오류 — 아래에서 재시도한다.
    }
    if (attempt >= LOAD_RETRY_DELAYS_MS.length) break
    await new Promise((resolve) => setTimeout(resolve, LOAD_RETRY_DELAYS_MS[attempt]))
  }
  handleLoadFailure(uid)
  return {}
}

export async function saveUserState(uid, key, value) {
  if (!uid || loadFailedUids.has(uid)) return
  try {
    await fetch(apiUrl(`/api/state/${uid}/${key}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    })
  } catch {
    // 네트워크 오류 시에도 화면 상태는 이미 반영돼 있으니 조용히 무시한다(다음 저장 시도에서 다시 맞춰짐).
  }
}

export const REPRESENTATIVE_CHARACTER_KEY = 'representativeCharacter'
