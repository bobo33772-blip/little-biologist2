import { useEffect, useState } from 'react'

// 요소가 화면에 한 번이라도 들어왔는지(곧 들어올지) 알려주는 훅. 도감 곤충 카드처럼 그림이 많은 목록에서
// 보이는 카드의 그림만 받으려고 쓴다. 브라우저 기본 loading="lazy"는 화면 아래 1250px 이상을
// 미리 받아서(가로 852x393 도감 첫 진입 3초에 79장 중 66장) 첫 진입 회선을 거의 아끼지 못했다.
//
// 기준(root)은 카드를 감싼 가장 가까운 스크롤 영역이다. 도감 목록은 overflow-y-auto 상자 안에서
// 스크롤하는데, 뷰포트를 기준으로 하면 rootMargin이 그 상자의 잘림에는 적용되지 않아 미리 볼 수가 없다 —
// 스크롤할 때마다 카드가 빈 채로 들어왔다가 그림이 붙었다(리뷰에서 재현).
//
// 그래서 두 단계로 본다.
// 1) 지금 실제로 화면에 보이는 카드는 바로 받는다 — 뷰포트 기준(root 없음), 여백 0. 뷰포트 기준은 스크롤
//    상자의 잘림과 화면 밖으로 나간 상자 부분을 모두 반영한다. 스크롤 상자를 기준으로 하면 상자 아래쪽이
//    화면 밖이어도 '보인다'고 판정했다.
// 2) 화면이 자리 잡은 뒤(LOOKAHEAD_DELAY_MS)부터 스크롤 상자 기준으로 한 화면 높이만큼 아래 카드도 미리
//    받는다. 들어오자마자 미리 받으면 느린 회선에서 곤충 그림 24장이 그 화면 배경과 회선을 다퉈 배경이
//    0.8초 → 5.6초로 늦게 떴다(실측).
//
// 스크롤 영역마다 종류별 observer를 하나씩만 두고, 한 번 보인 요소는 바로 관찰을 끝낸다.
const LOOKAHEAD_MARGIN = '0px 0px 100% 0px'
const LOOKAHEAD_DELAY_MS = 1200

const onSeen = new WeakMap()
const observersByRoot = new WeakMap()
const viewportObservers = {}

function handleEntries(entries, observer) {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue
    observer.unobserve(entry.target)
    const callback = onSeen.get(entry.target)
    onSeen.delete(entry.target)
    callback?.()
  }
}

// overflow가 auto·scroll이면서 내용이 실제로 넘치는 가장 가까운 조상. overflow만 보고 고르면, 높이가 정해지지
// 않아 스크롤되지 않는 상자를 기준으로 삼아 모든 카드가 처음부터 '보인 것'이 되어 그림을 한꺼번에 받는다.
function findScrollRoot(element) {
  for (let node = element.parentElement; node && node !== document.body && node !== document.documentElement; node = node.parentElement) {
    const { overflowX, overflowY } = window.getComputedStyle(node)
    const scrollsY = /(auto|scroll|overlay)/.test(overflowY) && node.scrollHeight > node.clientHeight + 1
    const scrollsX = /(auto|scroll|overlay)/.test(overflowX) && node.scrollWidth > node.clientWidth + 1
    if (scrollsY || scrollsX) return node
  }
  return null
}

// kind: 'visible'(여백 0, 뷰포트 기준으로만 쓴다) | 'ahead'(한 화면 아래까지). root가 null이면 뷰포트 기준이다.
function getObserver(root, kind) {
  if (typeof IntersectionObserver === 'undefined') return null
  let observers = root ? observersByRoot.get(root) : viewportObservers
  if (!observers) {
    observers = {}
    observersByRoot.set(root, observers)
  }
  if (!observers[kind]) {
    observers[kind] = new IntersectionObserver(handleEntries, {
      ...(root ? { root } : null),
      rootMargin: kind === 'ahead' ? LOOKAHEAD_MARGIN : '0px',
    })
  }
  return observers[kind]
}

export function useSeenOnce(ref) {
  // IntersectionObserver가 없는 환경이면 처음부터 보인 것으로 친다(그때는 loading="lazy"가 대신한다).
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const element = ref.current
    if (seen || !element) return undefined
    const visibleObserver = getObserver(null, 'visible')
    if (!visibleObserver) return undefined
    onSeen.set(element, () => setSeen(true))
    visibleObserver.observe(element)
    let aheadObserver = null
    const timer = window.setTimeout(() => {
      if (!onSeen.has(element)) return
      aheadObserver = getObserver(findScrollRoot(element), 'ahead')
      aheadObserver.observe(element)
    }, LOOKAHEAD_DELAY_MS)
    return () => {
      window.clearTimeout(timer)
      onSeen.delete(element)
      visibleObserver.unobserve(element)
      aheadObserver?.unobserve(element)
    }
  }, [ref, seen])

  return seen
}
