// 가방에서 "목장에 배치"한 인테리어 아이템들을 목장 화면 위에 그린다.
// RanchMapScene(대객체)과 동일한 드래그 이동 방식을 그대로 따른다 — 편집 모드일 때만 드래그로
// 위치를 바꿀 수 있고, 선택된 아이템의 크기는 Ranch.jsx의 하단 슬라이더로 조절한다.
import { useRef } from 'react'

export default function PlacedItemsLayer({ placements, isEditing, selectedId, onSelect, onPositionChange }) {
  const sceneRef = useRef(null)
  const draggingRef = useRef(null)

  const updatePosition = (event) => {
    const dragging = draggingRef.current
    const scene = sceneRef.current
    if (!dragging || !scene) return

    const rect = scene.getBoundingClientRect()
    const x = Math.max(5, Math.min(95, ((event.clientX - rect.left) / rect.width) * 100))
    const y = Math.max(8, Math.min(92, ((event.clientY - rect.top) / rect.height) * 100))
    onPositionChange(dragging.id, { x, y })
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
      className="pointer-events-none absolute inset-0"
    >
      {placements.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => {
            if (isEditing) onSelect(p.id)
          }}
          onPointerDown={(event) => {
            if (!isEditing) return
            event.preventDefault()
            event.stopPropagation()
            event.currentTarget.setPointerCapture(event.pointerId)
            draggingRef.current = { id: p.id }
          }}
          aria-label={p.name}
          style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `translate(-50%, -50%) scale(${p.scale})` }}
          className={`group pointer-events-auto absolute flex flex-col items-center gap-1 ${
            isEditing ? 'cursor-grab touch-none rounded-2xl outline-dashed outline-2 outline-white/80 active:cursor-grabbing' : ''
          } ${isEditing && selectedId === p.id ? 'outline-leaf-300 outline-4' : ''}`}
        >
          {p.image ? (
            <img
              src={p.image}
              alt=""
              aria-hidden="true"
              className={`w-[96px] drop-shadow-lg ${isEditing ? 'pointer-events-none' : ''}`}
            />
          ) : (
            <span
              className="grid h-[96px] w-[96px] place-items-center rounded-full bg-leaf-50 text-3xl drop-shadow-lg"
              aria-hidden="true"
            >
              🪑
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
