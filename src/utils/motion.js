import { useSyncExternalStore } from 'react'

// 화면 흐름 연출(장면 전환·탭 팝)의 시간과 곡선을 한 곳에 모은다. CSS 쪽 같은 값은 index.css 맨 끝의
// --lb-ease-* 변수다 — 둘을 바꿀 때는 함께 바꾼다.

// 끄는 스위치. false면 목장↔서식지 원형 커튼이 동작하지 않고, 원래의 즉시 이동과 서식지 확대 입장으로 돌아간다.
export const SCENE_TRANSITIONS_ENABLED = true

export const EASE_POINTS = {
  cover: [0.65, 0, 0.35, 1], // 덮기·걷기
  arrive: [0.22, 1, 0.36, 1], // 도착 페이드·감속
  pop: [0.34, 1.56, 0.64, 1], // 팝(오버슈트 4% 이하)
  out: [0.2, 0.7, 0.2, 1], // 일반 페이드
}

export const EASE = Object.fromEntries(
  Object.entries(EASE_POINTS).map(([name, points]) => [name, `cubic-bezier(${points.join(', ')})`]),
)

// cubic-bezier 곡선에서 진행도(y)가 progress가 되는 시간 비율(x, 0~1). y가 단조 증가하는 곡선(cover 등)에만 쓴다.
export function bezierTimeForProgress([x1, y1, x2, y2], progress) {
  const at = (a, b, s) => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3
  let low = 0
  let high = 1
  for (let i = 0; i < 30; i += 1) {
    const mid = (low + high) / 2
    if (at(y1, y2, mid) < progress) low = mid
    else high = mid
  }
  return at(x1, x2, (low + high) / 2)
}

// 목장↔서식지 원형 커튼(SceneTransitionProvider). 캐시가 있으면 들어가기 약 650ms, 나오기 약 620ms.
export const IRIS = {
  coverInMs: 300, // 들어가기: 탭한 자리에서 원이 퍼져 덮는다
  coverOutMs: 220, // 나오기: 화면 가운데에서 덮는다
  revealInMs: 320, // 들어가기 걷기: 커튼 전체가 옅어진다
  revealOutMs: 360, // 나오기 걷기: 원이 그 장소로 접혀 들어간다
  labelDelayMs: 140,
  labelFadeMs: 120,
  waitCapMs: 2200, // 다 덮은 뒤 다음 장면 그림을 기다리는 상한. 느린 망에서도 장소 이름과 로딩 알을 보여 주며 그림을 기다린다
  hopAfterMs: 400, // 이만큼 기다리면 장소 이름 아래에 로딩 알이 나타난다
  watchdogMs: 3200, // 시작 후 이 시간이 지나면 어떤 단계든 걷는다(덮기 약 300ms + 기다림 상한 2200ms + 여유)
  arrivedHoldMs: 600, // 걷힌 뒤에도 arrivedVia를 잠깐 남겨 도착 화면이 두 번 연출하지 않게 한다
  // 원을 화면을 겨우 덮는 크기보다 이만큼 크게 그린다. 그러면 애니메이션이 끝나기 조금 전에 이미 다 덮이고,
  // 그 순간 이동하면 다음 화면을 그리는 시간(실측 약 60ms)이 아직 퍼지는 원 아래에 숨는다.
  coverOverscan: 1.15,
  safetyExtraMs: 400, // 애니메이션 끝 신호가 안 와도 이만큼 더 지나면 끝난 것으로 본다
}

// 모션 줄이기: 원과 이동 없이 같은 색 단색 레이어의 opacity만 쓴다.
export const IRIS_REDUCED = {
  coverMs: 120,
  revealMs: 160,
}

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)'

function subscribeReducedMotion(callback) {
  const media = window.matchMedia?.(REDUCED_QUERY)
  if (!media) return () => {}
  media.addEventListener?.('change', callback)
  return () => media.removeEventListener?.('change', callback)
}

function getReducedMotion() {
  return window.matchMedia?.(REDUCED_QUERY).matches === true
}

// 기기의 '동작 줄이기' 설정. 설정을 바꾸면 바로 반영된다.
export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false)
}

// 누른 것이 살짝 눌렸다 튀어나오는 손맛(lb-tap-pop, index.css). 이동 시점은 바꾸지 않는다.
// 튜토리얼 타깃 버튼 자체에 transform을 걸면 z-[110]이 갇히므로 반드시 안쪽 그림(자식)에만 건다.
// CSS scale 속성으로 움직여서 그림에 이미 걸린 transform(대객체 크기 배율)과 겹쳐도 크기가 튀지 않는다.
export function playTapPop(element) {
  if (!element) return
  element.classList.remove('lb-tap-pop')
  // 연달아 누르면 처음부터 다시 재생되도록 클래스를 뗀 상태를 한 번 계산시킨다.
  void element.offsetWidth
  element.classList.add('lb-tap-pop')
  element.addEventListener('animationend', () => element.classList.remove('lb-tap-pop'), { once: true })
}
