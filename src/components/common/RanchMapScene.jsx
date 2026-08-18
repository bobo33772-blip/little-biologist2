import { useRef } from 'react'
import RanchPaths from './RanchPaths'
import { getWeatherParticleCount } from '../../api/weather.js'
import { useTutorial } from '../../context/TutorialContext'

const CLOUDY_IMAGES = [
  { src: new URL('../../../IMAGE/날씨 반영/구름 많음1.png', import.meta.url).href, className: 'ranch-weather-cloud--one' },
  { src: new URL('../../../IMAGE/날씨 반영/구름 많음2.png', import.meta.url).href, className: 'ranch-weather-cloud--two' },
  { src: new URL('../../../IMAGE/날씨 반영/구름 많음3.png', import.meta.url).href, className: 'ranch-weather-cloud--three' },
  { src: new URL('../../../IMAGE/날씨 반영/구름 많음4.png', import.meta.url).href, className: 'ranch-weather-cloud--four' },
]

// ranch.md: 서식지와 등록 곤충 표시. 실제 제공된 배경/오브젝트 자산(public/ranch/*.webp)을 사용한다.
// 목장 배경은 카드 전체를 여백 없이 꽉 채운다(cover) — 부모(Ranch.jsx)가 position:relative
// 이고 이 컴포넌트는 absolute inset-0으로 그 위를 덮는다. 원본 비율을 유지하려 letterbox하지
// 않고, 화면을 꽉 채우는 것을 우선한다 (넘치는 부분은 잘려도 무방).
//
// 대객체(서식지) 위치/크기는 편집 모드(isEditing)에서 드래그로 바꿀 수 있다 — 값은 Ranch.jsx의
// habitatPositions/habitatScales(positions/scales prop)에 저장되고, 편집 모드가 아니면
// insectSpecies.js의 HABITATS 기본 x/y/scale을 그대로 쓴다. w-max는 반드시 유지할 것 —
// left만 있고 right가 없는 absolute 요소는 남은 공간
// 기준으로 shrink-to-fit 되는데, Tailwind Preflight의 img{max-width:100%}와 겹치면 이미지가
// 줄어드는 버그가 생긴다 (한 번 겪은 버그).
//
// scale은 이미지에만 적용한다(버튼 전체가 아니라) — 대객체마다 확대비율이 달라도 라벨
// 글자 크기는 항상 동일해야 하기 때문. transform-origin을 bottom으로 둬서 이미지가
// 커져도 아래쪽 라벨과 겹치지 않고 위로만 확장되게 한다.
//
// 대객체 크기는 breakpoint(sm/md/lg) 기반 고정 px 대신 min(Npx, Mvw)로 화면 폭에
// 비례해서 정한다 — breakpoint 방식은 창 폭이 두 breakpoint 사이 어디에 있느냐에 따라
// (예: 데스크톱 넓은 창 vs 폰 좁은 화면) 화면 대비 대객체 크기 비율이 서로 달라져서,
// 같은 프로세스인데도 기기마다 "확대 정도"가 달라 보이는 문제가 있었다.
// px 상한은 아주 넓은 화면(초광폭 모니터)에서만 걸리게 크게 잡는다 — 그래야 폰 화면부터
// 일반 데스크톱 창 폭(~1600px)까지는 vw 비율이 그대로 적용돼서 기기별로 "확대 정도"가 달라지지
// 않는다. 이 vw 기준 크기 위에 scale(위 문단)이 추가로 곱해진다.
function objectSizeStyle(habitatId) {
  return habitatId === 'street-trees' ? { width: 'min(650px, 40vw)' } : { width: 'min(500px, 30vw)' }
}

export default function RanchMapScene({
  habitats,
  stats,
  weather,
  positions,
  scales,
  selectedId,
  isEditing = false,
  onSelect,
  onSelectEdit,
  onPositionChange,
}) {
  const { step, targetHabitatId } = useTutorial()
  const sceneRef = useRef(null)
  const draggingRef = useRef(null)

  const updatePosition = (event) => {
    const habitatId = draggingRef.current
    const scene = sceneRef.current
    if (!habitatId || !scene || !onPositionChange) return

    const rect = scene.getBoundingClientRect()
    const x = Math.max(5, Math.min(95, ((event.clientX - rect.left) / rect.width) * 100))
    const y = Math.max(8, Math.min(92, ((event.clientY - rect.top) / rect.height) * 100))
    onPositionChange(habitatId, { x, y })
  }

  return (
    <div
      ref={sceneRef}
      onPointerMove={(event) => {
        if (draggingRef.current) updatePosition(event)
      }}
      onPointerUp={() => {
        draggingRef.current = null
      }}
      onPointerCancel={() => {
        draggingRef.current = null
      }}
      className="absolute inset-0 bg-cover bg-center"
      style={{ backgroundImage: 'url(/ranch/background.webp)' }}
    >
      {/* 현재 위치 기반 실제 날씨(src/api/weather.js)를 목장 배경 위에 반영한다 — 맑음일 땐
          아무것도 안 그리고, 그 외 날씨는 비/눈/구름/안개/천둥 연출을 오버레이로 얹는다. */}
      {weather?.effect && weather.effect !== 'clear' ? (
        <div className={`ranch-weather-overlay ranch-weather-overlay--${weather.effect}`} aria-hidden="true">
          {weather.effect === 'cloudy' && CLOUDY_IMAGES.map((cloud, index) => (
            <span
              key={cloud.src}
              className={`ranch-weather-cloud ${cloud.className}`}
              style={{ animationDelay: `${-(index * 2.2)}s`, animationDuration: `${18 + index * 3}s` }}
            >
              <img src={cloud.src} alt="" aria-hidden="true" />
            </span>
          ))}
          {(weather.effect === 'rain' || weather.effect === 'storm') &&
            Array.from({ length: getWeatherParticleCount(weather.effect, weather) }, (_, index) => (
              <span
                key={`rain-${index}`}
                className="ranch-weather-drop"
                style={{
                  left: `${(index * 9.5) % 100}%`,
                  animationDuration: `${1.05 + (index % 6) * 0.16}s`,
                  animationDelay: `${-(index % 12) * 0.18}s`,
                }}
              />
            ))}
          {weather.effect === 'snow' &&
            Array.from({ length: getWeatherParticleCount(weather.effect, weather) }, (_, index) => (
              <span
                key={`snow-${index}`}
                className="ranch-weather-flake"
                style={{
                  left: `${(index * 11.25) % 100}%`,
                  animationDuration: `${2.2 + (index % 5) * 0.25}s`,
                  animationDelay: `${-(index % 10) * 0.25}s`,
                  '--drift': `${((index % 5) - 2) * 12}px`,
                }}
              />
            ))}
          {weather.effect === 'fog' && (
            <>
              <span className="ranch-weather-fog ranch-weather-fog--one" />
              <span className="ranch-weather-fog ranch-weather-fog--two" />
              <span className="ranch-weather-fog ranch-weather-fog--three" />
            </>
          )}
          {weather.effect === 'storm' && <span className="ranch-weather-flash" aria-hidden="true" />}
        </div>
      ) : null}
      <RanchPaths positions={positions} />

      {habitats.map((h) => {
        const s = stats[h.id] ?? { registered: 0, total: 0 }
        const position = positions?.[h.id] ?? { x: h.x, y: h.y }
        const scale = scales?.[h.id] ?? h.scale ?? 1
        const isTutorialHabitatTarget = step?.id === 'habitat' && h.id === (targetHabitatId ?? habitats[0].id) && !isEditing
        return (
          <button
            key={h.id}
            type="button"
            onClick={() => {
              if (isEditing) onSelectEdit?.(h.id)
              else onSelect?.(h)
            }}
            onPointerDown={(event) => {
              if (!isEditing) return
              event.preventDefault()
              event.stopPropagation()
              event.currentTarget.setPointerCapture(event.pointerId)
              draggingRef.current = h.id
            }}
            style={{ left: `${position.x}%`, top: `${position.y}%`, transform: 'translate(-50%, -50%)' }}
            className={`group absolute flex w-max flex-col items-center gap-1 ${
              isEditing ? 'cursor-grab touch-none rounded-2xl outline outline-2 outline-dashed outline-white/80 active:cursor-grabbing' : ''
            } ${isTutorialHabitatTarget ? 'z-[110]' : ''} ${isEditing && selectedId === h.id ? 'outline-4 outline-leaf-300' : ''}`}
          >
            <img
              src={h.image}
              alt=""
              aria-hidden="true"
              style={{
                ...objectSizeStyle(h.id),
                transform: `scale(${scale})`,
                transformOrigin: 'center bottom',
              }}
              className={`drop-shadow-lg transition-[filter] duration-150 group-hover:brightness-110 group-focus-visible:brightness-110 ${
                isEditing ? 'pointer-events-none' : ''
              }`}
            />
            <span className="ranch-habitat-label">
              {h.name} <span className="ranch-habitat-label__count">{s.registered}/{s.total}</span>
            </span>
            {/* 위쪽에 있는 대객체(숲 등)는 화면 맨 위에 가까워서 포인터를 이미지 위에 겹치면
                뷰포트 밖으로 잘려서 안 보인다. 대신 라벨 아래에 일반 flex 자식으로 붙여서
                항상 화면 안에 들어오게 한다. */}
            {isTutorialHabitatTarget && (
              <span className="tutorial-target-guide pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
                <span className="tutorial-target-ring" aria-hidden="true" />
                <span className="tutorial-target-arrow" aria-hidden="true">👇</span>
                <span className="tutorial-target-label">여기를 눌러보세요</span>
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
