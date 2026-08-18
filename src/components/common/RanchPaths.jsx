// ranch.md: 대객체(서식지)들 사이를 잇는 흙길. positions prop(Ranch.jsx의 habitatPositions,
// 편집 모드 드래그로 바뀜)이 있으면 그 좌표를, 없으면 insectSpecies.js의 HABITATS 기본
// x/y를 쓴다 — 즉 대객체를 드래그해서 옮기면 길도 같은 좌표를 읽어 자동으로 따라간다.
// 연결 관계(양방향, 중복 제거):
//   흙 속 - 연못, 흙 속 - 숲, 연못 - 숲, 연못 - 풀밭, 숲 - 가로수, 가로수 - 풀밭
//
// public/ranch/path-strip.png는 IMAGE/인테리어/길/가로.png(사용자가 준 흙길 이미지)에서
// 둥근 양쪽 끝을 잘라내고 가운데 직선 구간만 남긴 텍스처다 — 원본은 캡슐 모양이라
// background-repeat로 이어 붙이면 끝부분이 반복되어 보였음. 가운데 부분은 자연스러운
// 자갈/흙 패턴이라 이어 붙여도 이음매가 거의 안 보인다.
import { useEffect, useRef, useState } from 'react'
import { HABITATS } from '../../data/insectSpecies'

const PATH_EDGES = [
  ['soil', 'pond'],
  ['soil', 'forest'],
  ['pond', 'forest'],
  ['pond', 'grass'],
  ['forest', 'street-trees'],
  ['street-trees', 'grass'],
]

const JUNCTION_IDS = ['soil', 'pond', 'forest', 'street-trees', 'grass']

const PATH_DETAILS = [
  { edge: ['forest', 'street-trees'], t: 0.28, side: 1, kind: 'grass', size: 0.78 },
  { edge: ['forest', 'street-trees'], t: 0.58, side: -1, kind: 'pebble', size: 0.55 },
  { edge: ['street-trees', 'grass'], t: 0.18, side: 1, kind: 'pebble', size: 0.55 },
  { edge: ['street-trees', 'grass'], t: 0.38, side: -1, kind: 'moss', size: 0.75 },
  { edge: ['street-trees', 'grass'], t: 0.62, side: 1, kind: 'grass', size: 0.9 },
  { edge: ['street-trees', 'grass'], t: 0.8, side: -1, kind: 'flower', size: 0.62 },
  { edge: ['pond', 'grass'], t: 0.52, side: 1, kind: 'moss', size: 0.78 },
  { edge: ['pond', 'forest'], t: 0.45, side: -1, kind: 'pebble', size: 0.5 },
]

function findHabitat(id) {
  return HABITATS.find((h) => h.id === id)
}

function getPoint(id, positions, size) {
  const habitat = findHabitat(id)
  if (!habitat) return null
  const position = positions?.[id] ?? { x: habitat.x, y: habitat.y }
  return {
    id,
    x: (position.x / 100) * size.width,
    y: (position.y / 100) * size.height,
  }
}

function getPathPoint(id, positions, size) {
  const point = getPoint(id, positions, size)
  if (!point) return null
  if (id === 'street-trees') {
    const streetTreeWidth = Math.min(650, size.width * 0.4) * 0.75
    return {
      ...point,
      x: point.x,
      y: point.y + streetTreeWidth * 0.26,
    }
  }
  if (id === 'grass') {
    return {
      ...point,
      x: point.x - size.width * 0.02,
      y: point.y - size.height * 0.04,
    }
  }
  return point
}

function getEdgePoint(id, otherId, positions, size) {
  const point = getPathPoint(id, positions, size)
  if (!point) return null
  return point
}

function edgeKey(a, b) {
  return [a, b].sort().join('-')
}

function detailClass(kind) {
  if (kind === 'flower') return 'bg-rose-200 shadow-[0_0_0_2px_rgba(255,255,255,0.45)]'
  if (kind === 'moss') return 'bg-lime-500/65'
  if (kind === 'grass') return 'bg-emerald-600/70'
  return 'bg-stone-200/90'
}

export default function RanchPaths({ positions }) {
  const containerRef = useRef(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect
      setSize({ width: rect.width, height: rect.height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // 대객체 아이콘과 마찬가지로 화면 폭에 비례하는 폭을 쓴다(고정 px breakpoint 금지 —
  // 예전에 기기마다 확대 정도가 달라 보이던 버그를 다시 만들지 않기 위해).
  const roadWidth = Math.min(58, Math.max(32, size.width * 0.034))

  const edges = PATH_EDGES.map(([a, b]) => {
    const start = getEdgePoint(a, b, positions, size)
    const end = getEdgePoint(b, a, positions, size)
    if (!start || !end) return null
    const dx = end.x - start.x
    const dy = end.y - start.y
    const length = Math.hypot(dx, dy)
    const angle = Math.atan2(dy, dx) * (180 / Math.PI)
    return { a, b, key: edgeKey(a, b), start, end, dx, dy, length, angle }
  }).filter(Boolean)

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0">
      {size.width > 0 && edges.map((edge) => (
        <div
          key={edge.key}
          className="absolute"
          style={{
            left: edge.start.x,
            top: edge.start.y,
            width: edge.length,
            height: roadWidth,
            transform: `translateY(-50%) rotate(${edge.angle}deg)`,
            transformOrigin: 'left center',
          }}
        >
          <span
            className="absolute inset-x-[-0.55rem] inset-y-[-0.26rem] rounded-full bg-emerald-950/10 blur-[2px]"
            aria-hidden="true"
          />
          <span
            className="absolute inset-0 rounded-full opacity-95"
            style={{
              backgroundImage: 'url(/ranch/path-strip.png)',
              backgroundRepeat: 'repeat-x',
              backgroundSize: 'auto 100%',
            }}
            aria-hidden="true"
          />
          <span
            className="absolute left-0 right-0 top-0 h-[18%] rounded-full bg-lime-200/18"
            aria-hidden="true"
          />
          <span
            className="absolute bottom-0 left-0 right-0 h-[20%] rounded-full bg-stone-800/10"
            aria-hidden="true"
          />
        </div>
      ))}

      {size.width > 0 && JUNCTION_IDS.map((id) => {
        const point = getPoint(id, positions, size)
        if (!point) return null
        const streetTreeWidth = Math.min(650, size.width * 0.4) * 0.75
        const junctionPoint = id === 'street-trees'
          ? {
              x: point.x,
              y: point.y + streetTreeWidth * 0.26,
            }
          : point
        return (
          <span
            key={id}
            className="absolute rounded-full bg-[radial-gradient(circle,rgba(180,142,88,0.52),rgba(137,104,62,0.26)_48%,rgba(70,110,47,0)_72%)]"
            style={{
              left: junctionPoint.x,
              top: junctionPoint.y,
              width: roadWidth * 2.4,
              height: roadWidth * 1.55,
              transform: 'translate(-50%, -50%) rotate(-8deg)',
              filter: 'blur(0.2px)',
            }}
            aria-hidden="true"
          />
        )
      })}

      {size.width > 0 && PATH_DETAILS.map((detail, index) => {
        const edge = edges.find((item) => item.key === edgeKey(...detail.edge))
        if (!edge) return null
        const nx = -edge.dy / edge.length
        const ny = edge.dx / edge.length
        const offset = roadWidth * 0.58 * detail.side
        const x = edge.start.x + edge.dx * detail.t + nx * offset
        const y = edge.start.y + edge.dy * detail.t + ny * offset
        const dotSize = roadWidth * 0.18 * detail.size
        return (
          <span
            key={`${detail.edge.join('-')}-${index}`}
            className={`absolute rounded-full ${detailClass(detail.kind)}`}
            style={{
              left: x,
              top: y,
              width: dotSize,
              height: detail.kind === 'grass' ? dotSize * 1.6 : dotSize,
              transform: `translate(-50%, -50%) rotate(${edge.angle + (detail.side * 24)}deg)`,
              opacity: detail.kind === 'pebble' ? 0.78 : 0.7,
            }}
            aria-hidden="true"
          />
        )
      })}
    </div>
  )
}
