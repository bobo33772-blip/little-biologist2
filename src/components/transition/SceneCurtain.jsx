// 장면 전환 원형 커튼의 모양만 그린다. 움직임(덮기·걷기)은 SceneTransitionProvider가 WAAPI로 돌린다.
// body portal로 그려서 페이지 콘텐츠의 조상에 transform·opacity가 남지 않는다(튜토리얼 z-[110] 타깃과
// fixed 모달 보호). clip-path 대신 원 div 하나의 transform scale만 움직여 합성 단계에서 끝나게 한다.

import { IRIS } from '../../utils/motion'

// 화면 크기(W×H)에서 (x, y)를 중심으로 화면 네 모서리를 모두 덮는 원의 지름(여유 배율 IRIS.coverOverscan 포함).
export function coverDiameter(x, y, width, height) {
  return 2 * Math.hypot(Math.max(x, width - x), Math.max(y, height - y)) * IRIS.coverOverscan
}

export function viewportCenter() {
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 }
}

// 원 div의 위치·크기. 걷기 직전에 원점을 옮길 때 Provider도 같은 값을 DOM에 바로 쓴다.
export function discGeometry(origin) {
  const width = window.innerWidth
  const height = window.innerHeight
  const { x, y } = origin ?? viewportCenter()
  const size = coverDiameter(x, y, width, height)
  return { left: x - size / 2, top: y - size / 2, width: size, height: size }
}

// 장소 이름은 탭한 자리에 붙여 원과 함께 퍼져 보이게 하되, 화면 가장자리에서 잘리지 않게 안쪽으로 당긴다.
function labelPosition(origin) {
  const width = window.innerWidth
  const height = window.innerHeight
  const { x, y } = origin ?? viewportCenter()
  // 화면 가운데 쪽 절반 안에 둔다 — 위쪽 끝 서식지(숲)를 눌러도 다 덮인 화면에서 이름이 가장자리에 붙지 않는다.
  const padX = width * 0.25
  const padY = height * 0.3
  return {
    left: Math.min(width - padX, Math.max(padX, x)),
    top: Math.min(height - padY, Math.max(padY, y)),
  }
}

export default function SceneCurtain({ view, rootRef, discRef, labelRef }) {
  const { phase, color, label, origin, reduced, showHop } = view
  return (
    <div
      ref={rootRef}
      className="lb-scene-curtain"
      data-phase={phase}
      // 덮는 동안에는 반쯤 바뀐 화면을 누르지 못하게 막는 방패를 겸한다. 걷기 시작하면 바로 통과시킨다.
      style={{ pointerEvents: phase === 'revealing' ? 'none' : 'auto' }}
    >
      <div
        ref={discRef}
        className={reduced ? 'lb-scene-curtain__disc is-flat' : 'lb-scene-curtain__disc'}
        style={reduced ? { background: color } : { ...discGeometry(origin), background: color }}
      />
      {(label || showHop) && (
        <div className="lb-scene-curtain__center" style={labelPosition(origin)} role="status" aria-live="polite">
          {label && (
            <p ref={labelRef} className="lb-scene-curtain__label">
              {label}
            </p>
          )}
          {/* 오래 기다릴 때만 게임 로딩 장면과 같은 알이 통통 튄다(index.html의 .lb-boot__* 모양). */}
          {showHop && (
            <div className="lb-boot__stage lb-scene-curtain__hop" aria-hidden="true">
              <span className="lb-boot__egg" />
              <span className="lb-boot__shadow" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
