import { useEffect, useState } from 'react'

// 한 번 받아서 decode까지 끝낸 그림 주소. 같은 장면에 다시 들어오면 첫 렌더부터 '준비됨'으로
// 시작해서 덮개(목장 준비 커튼 등)를 아예 그리지 않는다.
const readySrcs = new Set()

// 이미 브라우저 메모리 캐시에 있는 그림은 new Image()에 주소를 넣는 순간 complete가 된다.
function isAlreadyReady(srcs) {
  return srcs.every((src) => {
    if (readySrcs.has(src)) return true
    const img = new Image()
    img.src = src
    if (img.complete && img.naturalWidth > 0) {
      readySrcs.add(src)
      return true
    }
    return false
  })
}

// 그림 한 장이 지금 바로 그려질 수 있는지(이미 받아 둔 그림인지). 서식지 배경 img처럼 '첫 렌더부터
// 보일지, 받은 뒤 서서히 나타날지'를 고를 때 쓴다.
export function isImageReady(src) {
  return Boolean(src) && isAlreadyReady([src])
}

// 받는 중인 그림. 커튼 준비 여부와 진행 막대가 같은 그림을 동시에 기다려도 한 번만 받는다.
const loadingSrcs = new Map()

// 받기만 끝나면 첫 페인트 때 decode가 밀려 그림이 위에서부터 그려질 수 있어서 decode까지 기다린다.
// 깨진 그림 하나 때문에 장면 전체가 멈추지 않도록 실패해도 끝난 것으로 본다(Set에는 넣지 않는다).
function loadAndDecode(src) {
  if (readySrcs.has(src)) return Promise.resolve()
  let promise = loadingSrcs.get(src)
  if (!promise) {
    promise = new Promise((resolve) => {
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => {
        img.decode().catch(() => {}).then(() => {
          readySrcs.add(src)
          resolve()
        })
      }
      img.onerror = () => resolve()
      img.src = src
    }).finally(() => loadingSrcs.delete(src))
    loadingSrcs.set(src, promise)
  }
  return promise
}

// srcs가 모두 받아지고 decode될 때까지 false, 끝나면 true. timeoutMs가 지나면 덜 받아졌어도 true로
// 바꿔서 덮개가 영영 안 걷히는 일이 없게 한다. srcs 목록이 바뀌면 그 목록 기준으로 다시 판단한다.
export default function useImagesReady(srcs, { timeoutMs = 4000 } = {}) {
  const key = srcs.filter(Boolean).join('\n')
  const [state, setState] = useState(() => ({ key, ready: isAlreadyReady(key ? key.split('\n') : []) }))
  let ready = state.ready
  if (state.key !== key) {
    // 렌더 중에 이전 값을 고치는 React 권장 방식(effect를 한 번 더 돌리지 않는다).
    ready = isAlreadyReady(key ? key.split('\n') : [])
    setState({ key, ready })
  }

  useEffect(() => {
    if (ready) return undefined
    let cancelled = false
    const finish = () => {
      if (cancelled) return
      cancelled = true
      setState((current) => (current.key === key ? { key, ready: true } : current))
    }
    const timer = window.setTimeout(finish, timeoutMs)
    Promise.all(key.split('\n').map(loadAndDecode)).then(finish)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [key, ready, timeoutMs])

  return ready
}

function countReady(srcs) {
  return srcs.filter((src) => isAlreadyReady([src])).length
}

// srcs 가운데 몇 장이 받아졌는지(실패도 끝난 것으로 센다). 시한이 없어서 loaded === total이면
// "정말로 다 받았다"는 뜻이다 — 목장 준비 커튼의 진행 막대와, 그림을 다 받은 뒤에 시작해야 하는
// 일(효과음 미리받기 신호)에 쓴다.
export function useImageLoadProgress(srcs) {
  const key = srcs.filter(Boolean).join('\n')
  const [state, setState] = useState(() => ({ key, loaded: countReady(key ? key.split('\n') : []) }))
  let loaded = state.loaded
  if (state.key !== key) {
    loaded = countReady(key ? key.split('\n') : [])
    setState({ key, loaded })
  }

  useEffect(() => {
    const list = key ? key.split('\n') : []
    let cancelled = false
    let done = 0
    list.forEach((src) => {
      loadAndDecode(src).then(() => {
        if (cancelled) return
        done += 1
        setState((current) => (current.key === key ? { key, loaded: Math.max(current.loaded, done) } : current))
      })
    })
    return () => {
      cancelled = true
    }
  }, [key])

  return { loaded, total: key ? key.split('\n').length : 0 }
}
