import { useEffect, useRef, useState } from 'react'

const COLORS = ['#2c2c2c', '#d64545', '#e0a327', '#3f7d4f', '#3b6fd6', '#8a4fd6']
const SIZES = [
  { id: 'thin', label: '얇게', value: 3 },
  { id: 'medium', label: '보통', value: 6 },
  { id: 'thick', label: '굵게', value: 12 },
]

const MIN_ZOOM = 1
const MAX_ZOOM = 3
const ZOOM_STEP = 0.25
const MIN_INK_PIXELS = 10
const MIN_INK_BOUNDS = 2
const TRACE_GUIDE_PADDING = 16
const MIN_TRACE_COVERAGE = 0.3

function analyzeCanvasInk(canvas) {
  const ctx = canvas.getContext('2d')
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  let inkPixels = 0
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] <= 8) continue

    inkPixels += 1
    const pixelIndex = index / 4
    const x = pixelIndex % width
    const y = Math.floor(pixelIndex / width)
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }

  if (!inkPixels) return { hasInk: false, inkPixels: 0, boundsWidth: 0, boundsHeight: 0 }

  const boundsWidth = maxX - minX + 1
  const boundsHeight = maxY - minY + 1
  const hasMeaningfulInk =
    inkPixels >= MIN_INK_PIXELS &&
    boundsWidth >= MIN_INK_BOUNDS &&
    boundsHeight >= MIN_INK_BOUNDS

  return { hasInk: hasMeaningfulInk, inkPixels, boundsWidth, boundsHeight }
}

function getContainRect(containerWidth, containerHeight, imageWidth, imageHeight) {
  const availableWidth = Math.max(0, containerWidth - TRACE_GUIDE_PADDING * 2)
  const availableHeight = Math.max(0, containerHeight - TRACE_GUIDE_PADDING * 2)
  const scale = Math.min(availableWidth / imageWidth, availableHeight / imageHeight)
  const drawWidth = imageWidth * scale
  const drawHeight = imageHeight * scale

  return {
    x: (containerWidth - drawWidth) / 2,
    y: (containerHeight - drawHeight) / 2,
    width: drawWidth,
    height: drawHeight,
  }
}

function calculateTraceCoverage(canvas, guideImage) {
  if (!guideImage?.naturalWidth || !guideImage?.naturalHeight) return null

  const guideCanvas = document.createElement('canvas')
  guideCanvas.width = canvas.width
  guideCanvas.height = canvas.height

  const guideCtx = guideCanvas.getContext('2d')
  const rect = getContainRect(canvas.width, canvas.height, guideImage.naturalWidth, guideImage.naturalHeight)
  guideCtx.drawImage(guideImage, rect.x, rect.y, rect.width, rect.height)

  const guideData = guideCtx.getImageData(0, 0, guideCanvas.width, guideCanvas.height).data
  const drawingData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data

  let guidePixels = 0
  let matchedPixels = 0

  for (let index = 0; index < guideData.length; index += 4) {
    if (guideData[index + 3] <= 8) continue
    guidePixels += 1
    if (drawingData[index + 3] > 8) matchedPixels += 1
  }

  if (!guidePixels) return null
  return matchedPixels / guidePixels
}

// 참고 이미지(흑백·반투명) 위에 캔버스를 겹쳐서 그림판처럼 손으로 따라 그릴 수 있게 한다.
// 다 그리면 canvas를 dataURL로 구워서 onComplete로 넘긴다. traceMode일 때는 완료 전에
// 캔버스가 비어있지 않은지, 가이드 이미지를 충분히 따라 그렸는지 검사한다.
export default function DrawingCanvas({ backgroundImage, altText, onComplete, traceMode = false }) {
  const canvasRef = useRef(null)
  const guideImageRef = useRef(null)
  const viewportRef = useRef(null)
  const isDrawingRef = useRef(false)
  const lastPointRef = useRef(null)
  const undoStackRef = useRef([])
  const [color, setColor] = useState(COLORS[0])
  const [sizeId, setSizeId] = useState('medium')
  const [isErasing, setIsErasing] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [completionError, setCompletionError] = useState('')

  // 캔버스의 실제 해상도는 확대(zoom)와 무관하게 뷰포트(스크롤 영역)의 기본 크기로 고정한다.
  // zoom은 CSS transform으로만 확대해서 보여주고, 확대·축소해도 그려둔 그림이 지워지지 않게 한다.
  useEffect(() => {
    const canvas = canvasRef.current
    const viewport = viewportRef.current
    if (!canvas || !viewport) return

    function syncCanvasSize() {
      const rect = viewport.getBoundingClientRect()
      const ctx = canvas.getContext('2d')
      const previous = canvas.width && canvas.height ? ctx.getImageData(0, 0, canvas.width, canvas.height) : null
      canvas.width = rect.width
      canvas.height = rect.height
      if (previous) ctx.putImageData(previous, 0, 0)
      undoStackRef.current = []
    }

    syncCanvasSize()
    window.addEventListener('resize', syncCanvasSize)
    return () => window.removeEventListener('resize', syncCanvasSize)
  }, [])

  useEffect(() => {
    function handleKeyDown(event) {
      const isUndoShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z'
      if (!isUndoShortcut) return

      if (!canvasRef.current) return
      event.preventDefault()
      isDrawingRef.current = false

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      const previousState = undoStackRef.current.pop()
      if (!previousState) return

      ctx.putImageData(previousState, 0, 0)
      setCompletionError('')
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 확대된 상태에서도 화면 좌표 → 캔버스 실제 픽셀 좌표로 정확히 변환한다.
  function getPoint(event) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  function zoomIn() {
    setZoom((value) => Math.min(MAX_ZOOM, +(value + ZOOM_STEP).toFixed(2)))
  }

  function zoomOut() {
    setZoom((value) => Math.max(MIN_ZOOM, +(value - ZOOM_STEP).toFixed(2)))
  }

  function startDraw(event) {
    isDrawingRef.current = true
    lastPointRef.current = getPoint(event)
    undoStackRef.current.push(canvasRef.current.getContext('2d').getImageData(0, 0, canvasRef.current.width, canvasRef.current.height))
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function draw(event) {
    if (!isDrawingRef.current) return
    const point = getPoint(event)
    const ctx = canvasRef.current.getContext('2d')
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = SIZES.find((size) => size.id === sizeId)?.value ?? 6
    ctx.globalCompositeOperation = isErasing ? 'destination-out' : 'source-over'
    ctx.strokeStyle = color
    ctx.beginPath()
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    lastPointRef.current = point
  }

  function endDraw() {
    isDrawingRef.current = false
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    undoStackRef.current = []
    setCompletionError('')
  }

  function handleComplete() {
    const canvas = canvasRef.current
    const ink = analyzeCanvasInk(canvas)
    if (!ink.hasInk) {
      setCompletionError('그림이 아직 너무 비어 있어요. 조금 더 그려 주세요.')
      return
    }

    if (traceMode) {
      const coverage = calculateTraceCoverage(canvas, guideImageRef.current)
      if (coverage == null) {
        setCompletionError('가이드 이미지를 아직 불러오는 중이에요. 잠시만 기다려 주세요.')
        return
      }
      if (coverage < MIN_TRACE_COVERAGE) {
        setCompletionError(`가이드 그림을 더 따라 그려 주세요. 현재 ${Math.round(coverage * 100)}%예요.`)
        return
      }
    }

    setCompletionError('')
    onComplete(canvas.toDataURL('image/png'))
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {COLORS.map((swatch) => (
            <button
              key={swatch}
              type="button"
              onClick={() => {
                setColor(swatch)
                setIsErasing(false)
              }}
              aria-label={`펜 색상 ${swatch}`}
              className={`h-7 w-7 rounded-full ring-2 ring-offset-1 ${
                !isErasing && color === swatch ? 'ring-ink-900' : 'ring-transparent'
              }`}
              style={{ backgroundColor: swatch }}
            />
          ))}
        </div>

        <div className="flex gap-1">
          {SIZES.map((size) => (
            <button
              key={size.id}
              type="button"
              onClick={() => setSizeId(size.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                sizeId === size.id ? 'bg-leaf-500 text-white' : 'bg-ivory-100 text-ink-700 hover:bg-ivory-200'
              }`}
            >
              {size.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIsErasing((value) => !value)}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isErasing ? 'bg-ink-900 text-white' : 'bg-ivory-100 text-ink-700 hover:bg-ivory-200'
          }`}
        >
          🧽 지우개
        </button>

        <button
          type="button"
          onClick={clearCanvas}
          className="rounded-full bg-ivory-100 px-3 py-1 text-xs font-semibold text-ink-700 hover:bg-ivory-200"
        >
          전체 지우기
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={zoomOut}
            disabled={zoom <= MIN_ZOOM}
            aria-label="곤충 축소"
            className="grid h-7 w-7 place-items-center rounded-full bg-ivory-100 text-sm font-bold text-ink-700 hover:bg-ivory-200 disabled:opacity-40"
          >
            −
          </button>
          <span className="min-w-[3rem] text-center text-xs font-semibold text-ink-700/70 tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            disabled={zoom >= MAX_ZOOM}
            aria-label="곤충 확대"
            className="grid h-7 w-7 place-items-center rounded-full bg-ivory-100 text-sm font-bold text-ink-700 hover:bg-ivory-200 disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className="relative h-[55vh] max-h-[520px] w-full overflow-auto rounded-xl bg-ivory-50"
      >
        <div className="relative h-full w-full origin-top-left" style={{ transform: `scale(${zoom})` }}>
          <img
            ref={guideImageRef}
            src={backgroundImage}
            alt={altText}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full object-contain p-4 grayscale opacity-40"
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full touch-none cursor-crosshair"
            onPointerDown={startDraw}
            onPointerMove={draw}
            onPointerUp={endDraw}
            onPointerCancel={endDraw}
          />
        </div>
      </div>
      {zoom > 1 && (
        <p className="mt-1.5 text-center text-xs text-ink-700/55">확대된 상태에서는 화면을 스크롤해서 다른 부분을 볼 수 있어요.</p>
      )}

      <button
        type="button"
        onClick={handleComplete}
        className="mt-4 w-full rounded-full bg-leaf-500 px-4 py-2 text-sm font-semibold text-white hover:bg-leaf-600"
      >
        다 그렸어요
      </button>

      {completionError && <p className="mt-2 text-sm font-medium text-amber-700">{completionError}</p>}
    </div>
  )
}
