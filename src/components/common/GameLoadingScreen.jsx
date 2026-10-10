import { useEffect, useLayoutEffect, useRef, useState } from 'react'

// 게임 로딩 장면. index.html 스플래시와 같은 .lb-boot 마크업이고 모양(CSS)도 index.html에만 있다.
// 쓰는 곳: 화면 JS를 기다리는 Suspense 대기 화면, 첫 주소(/) 분기, 목장 준비 커튼(RanchSceneCurtain).
//
// 스플래시 → 대기 화면 → 목장 커튼처럼 같은 장면이 다른 DOM으로 이어질 때 애니메이션이 처음부터
// 다시 돌면 알이 사라졌다 나타나고(150ms 등장 지연) 제자리로 튄다. 그래서 장면이 끊기지 않고
// 이어지는 동안에는 처음 시작 시각을 함께 쓰고, 그 시각 기준으로 animation-delay를 당겨 이어 그린다.
const HANDOFF_GRACE_MS = 150

let timelineStart = null
let mountedCount = 0
let lastHiddenAt = -Infinity

// 렌더 중(=React가 #root의 스플래시를 지우기 전)에 불러야 스플래시가 아직 DOM에 있다.
function joinLoadingTimeline() {
  const now = performance.now()
  const splash = document.getElementById('lb-boot-static')
  if (splash) {
    const started = splash.getAnimations?.({ subtree: true }).find((animation) => typeof animation.startTime === 'number')
    timelineStart = started ? started.startTime : now
  } else if (timelineStart === null || (mountedCount === 0 && now - lastHiddenAt > HANDOFF_GRACE_MS)) {
    timelineStart = now
  }
  return timelineStart
}

export default function GameLoadingScreen({ className = '', message = '목장 문을 여는 중이에요', progress, onAnimationEnd }) {
  const rootRef = useRef(null)
  const [startedAt] = useState(joinLoadingTimeline)

  // 그리기 직전에 지난 시간만큼 각 애니메이션의 delay를 당긴다(data-lb-delay = 원래 delay).
  useLayoutEffect(() => {
    const elapsed = performance.now() - startedAt
    if (elapsed <= 0) return
    rootRef.current?.querySelectorAll('[data-lb-delay]').forEach((element) => {
      element.style.animationDelay = `${Number(element.dataset.lbDelay) - elapsed}ms`
    })
  }, [startedAt])

  useEffect(() => {
    mountedCount += 1
    return () => {
      mountedCount -= 1
      lastHiddenAt = performance.now()
    }
  }, [])

  return (
    <div ref={rootRef} className={`lb-boot ${className}`} role="status" aria-live="polite" onAnimationEnd={onAnimationEnd}>
      <div className="lb-boot__stage" data-lb-delay="150" aria-hidden="true">
        <span className="lb-boot__egg" data-lb-delay="150" />
        <span className="lb-boot__shadow" data-lb-delay="150" />
      </div>
      <p className="lb-boot__text" data-lb-delay="400">{message}</p>
      {/* 진행 막대(목장 준비 커튼만). 짧은 대기에는 보이지 않게 700ms 뒤에 나타난다 — 느린 회선에서
          오래 기다릴 때만 '받는 중'이라는 걸 보여 준다. */}
      {typeof progress === 'number' && (
        <span className="lb-boot__bar" data-lb-delay="700" aria-hidden="true">
          <span className="lb-boot__bar-fill" style={{ transform: `scaleX(${Math.min(1, Math.max(0.06, progress))})` }} />
        </span>
      )}
    </div>
  )
}
