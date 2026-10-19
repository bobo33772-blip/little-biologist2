import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import GameLoadingScreen from './GameLoadingScreen'

const LEAVE_MS = 280 // index.css .lb-ranch-curtain.is-leaving과 같은 값
const SAFETY_MS = LEAVE_MS + 400

// 목장 준비 커튼. 목장 배경과 대객체 그림이 다 준비될 때까지(최대 8초, Ranch.jsx) 게임 로딩 장면으로
// 덮어 두었다가 한 번에 걷는다 — 아이보리 바탕에 지도 뼈대가 먼저 보이고 그림이 위에서부터
// 그려지거나 대객체가 하나씩 툭 나타나는 조립 과정을 가리려는 것.
// body portal로 그려야 RanchCamera의 transform(확대·팬) 영향을 받지 않고 화면 전체를 덮는다.
// 덮는 동안에는 반쯤 그려진 지도를 누르지 못하게 막고, 걷기 시작하면 바로 통과시킨다.
export default function RanchSceneCurtain({ ready, progress, onGone }) {
  // animationend가 안 오는 경우(탭이 백그라운드로 가는 등)에도 반드시 DOM에서 빠지게 한다.
  useEffect(() => {
    if (!ready) return undefined
    const timer = window.setTimeout(onGone, SAFETY_MS)
    return () => window.clearTimeout(timer)
  }, [ready, onGone])

  return createPortal(
    <GameLoadingScreen
      className={`lb-ranch-curtain${ready ? ' is-leaving' : ''}`}
      progress={progress}
      onAnimationEnd={(event) => {
        // 알의 등장 애니메이션도 여기까지 올라오므로 커튼 자신의 걷기만 본다.
        if (event.target === event.currentTarget && event.animationName === 'lb-curtain-out') onGone()
      }}
    />,
    document.body,
  )
}
