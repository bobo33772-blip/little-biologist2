import { useRef } from 'react'
import { useSeenOnce } from '../../utils/useSeenOnce'

export default function InsectCard({ name, image, rank, registered, onClick, showRankDot = true, showTutorialPointer }) {
  const rankClass = showRankDot && registered && rank ? `insect-card--${rank}` : ''
  const displayName = registered ? name : '미수집 곤충'
  const imageBoxRef = useRef(null)
  const imageSeen = useSeenOnce(imageBoxRef)

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={registered ? name : '미수집 곤충'}
      className={`insect-card relative ${rankClass} flex w-full flex-col gap-2 rounded-xl bg-white p-2 text-left shadow-card transition ${
        registered ? 'hover:-translate-y-0.5 hover:shadow-soft' : 'opacity-85 hover:shadow-soft'
      }`}
    >
      {showTutorialPointer && (
        <span className="pointer-events-none absolute -top-16 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-1 whitespace-nowrap">
          <span className="text-4xl drop-shadow-md animate-bounce" aria-hidden="true">👇</span>
          <span className="rounded-full bg-ink-900/85 px-2.5 py-1 text-[10px] font-bold text-white shadow-card">여기를 눌러보세요</span>
        </span>
      )}
      <div
        ref={imageBoxRef}
        className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-ivory-50"
      >
        {/* 도감은 카드가 79장이라 한꺼번에 받으면 곤충 그림(약 10MB)이 회선을 독점한다. 카드 칸이
            화면에 들어온 뒤에만 img를 그려 그때 받는다. 칸은 aspect-[4/3]로 미리 자리를 잡고 있어
            그림이 늦게 와도 카드가 밀리지 않는다. */}
        {image && imageSeen && (
          <img
            src={image}
            alt=""
            aria-hidden="true"
            // IntersectionObserver가 없는 브라우저에서는 기본 lazy가 대신 막아 준다.
            // width/height는 카드의 4:3 비율과 같은 값이다.
            loading="lazy"
            decoding="async"
            width={400}
            height={300}
            className={`h-full w-full object-contain p-2 ${registered ? '' : 'grayscale opacity-30'}`}
          />
        )}
        {!registered && (
          <div className="absolute inset-0 grid place-items-center bg-ink-900/10">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white/85 text-lg font-bold text-ink-700/55 shadow-card">
              ?
            </span>
          </div>
        )}
      </div>
      <div className="flex w-full items-center justify-between px-0.5">
        <span className={`truncate text-sm font-medium ${registered ? 'text-ink-900' : 'text-ink-700/70'}`}>
          {displayName}
        </span>
      </div>
    </button>
  )
}
