import { useEffect, useState } from 'react'

// 자주 오가는 화면(목장↔도감·상점·미션 등)의 도착 페이드. 새 화면이 이미 그려진 위에 같은 색 덮개를 한 장 얹고
// 걷기만 한다 — 이동을 늦추지 않고(지연 0ms) '장면이 피어나는' 느낌만 준다. 페이지 형제로 opacity만 바꾸므로
// 페이지 조상에 transform·opacity를 남기지 않는다(튜토리얼 z-[110] 타깃·fixed 모달 보호).
// disabled는 한 번 켜지면 되돌아오지 않는다 — 튜토리얼이 끝나는 등으로 나중에 풀려도 화면 한가운데서 갑자기
// 덮개가 다시 나타나면 안 되기 때문이다.
export default function ArrivalVeil({ color, durationMs = 200, className = '', disabled = false }) {
  const [gone, setGone] = useState(disabled)
  if (disabled && !gone) setGone(true)

  // animationend가 안 오는 경우(탭이 백그라운드로 가는 등)에도 반드시 DOM에서 빠지게 한다.
  useEffect(() => {
    if (gone) return undefined
    const timer = window.setTimeout(() => setGone(true), durationMs + 400)
    return () => window.clearTimeout(timer)
  }, [gone, durationMs])

  if (gone) return null
  return (
    <div
      aria-hidden="true"
      className={`lb-arrival-veil pointer-events-none ${className}`}
      style={{ background: color, animationDuration: `${durationMs}ms` }}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) setGone(true)
      }}
    />
  )
}
