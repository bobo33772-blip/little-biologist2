// 장면 전환이 화면을 넘나들며 기억해야 하는 작은 값들. 모듈 변수라 새로고침하면 사라진다(의도 —
// 바로 앞 화면 이동에만 쓰는 값이다).

// 방금 떠난 서식지. 목장에 도착하면 원형 커튼이 이 서식지 대객체 자리로 접혀 들어간다.
let lastHabitatExit = null

export function rememberHabitatExit(habitatId) {
  lastHabitatExit = { habitatId, at: performance.now() }
}

// maxAgeMs 안에 떠난 서식지만 돌려준다. 읽어도 지우지 않는다 — 개발 모드(StrictMode)는 layout effect를
// 두 번 돌리므로, 첫 번째가 지워 버리면 두 번째 계산이 원점을 잃는다. 다음 이동이 새 값으로 덮는다.
export function getRecentHabitatExit(maxAgeMs = 1500) {
  if (!lastHabitatExit) return null
  return performance.now() - lastHabitatExit.at <= maxAgeMs ? lastHabitatExit : null
}

// 목장 대객체 위치(편집값). 목장을 다시 그릴 때 서버 값을 기다리는 동안 기본 위치로 그렸다가 옮겨지면
// 대객체가 튀고, 커튼이 접혀 들어갈 자리도 틀린다. 계정이 바뀌면 쓰지 않는다.
let ranchLayout = null

export function rememberRanchLayout(uid, positions) {
  ranchLayout = { uid, positions }
}

export function getRanchLayout(uid) {
  return ranchLayout && ranchLayout.uid === uid ? ranchLayout.positions : null
}
