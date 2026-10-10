// 첫 장면(목장 지도·로그인 배경·기능 화면)이 다 그려졌다는 신호. 효과음·배경음 미리받기가
// 이 신호를 기다렸다가 시작해야 첫 화면의 JS·그림과 회선을 다투지 않는다(실측: mp3 67건이
// 동시에 받아지면 느린 회선에서 목장 배경이 39초까지 늦어졌다).
export const SCENE_READY_EVENT = 'little-biologist:scene-ready'

let isReady = false

// 여러 곳에서 불러도 이벤트는 처음 한 번만 보낸다.
export function markSceneReady() {
  if (isReady) return
  isReady = true
  window.dispatchEvent(new Event(SCENE_READY_EVENT))
}

// 신호가 끝내 안 오는 화면(직접 연 서식지 주소 등)에서도 소리 준비가 영영 미뤄지지 않도록
// timeoutMs가 지나면 그냥 진행한다. 느린 회선(약 1.6Mbps)에서는 목장 그림이 10초 넘게 걸려서,
// 시한이 짧으면 효과음이 남은 그림과 회선을 다시 다툰다(실측). 그래서 15초로 둔다.
export function whenSceneReady({ timeoutMs = 15000 } = {}) {
  if (isReady) return Promise.resolve()
  return new Promise((resolve) => {
    let timer = null
    const done = () => {
      window.clearTimeout(timer)
      window.removeEventListener(SCENE_READY_EVENT, done)
      resolve()
    }
    timer = window.setTimeout(done, timeoutMs)
    window.addEventListener(SCENE_READY_EVENT, done)
  })
}
