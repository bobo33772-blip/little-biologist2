import { useEffect, useState } from 'react'

// 요소가 화면에 한 번이라도 들어왔는지 알려주는 훅. 도감 곤충 카드처럼 그림이 많은 목록에서
// 보이는 카드의 그림만 받으려고 쓴다. 브라우저 기본 loading="lazy"는 화면 아래 1250px 이상을
// 미리 받아서(가로 852x393 도감 첫 진입 3초에 79장 중 66장) 첫 진입 회선을 거의 아끼지 못했다.
//
// 카드마다 observer를 만들지 않도록 모듈에 하나만 두고, 한 번 보인 요소는 바로 관찰을 끝낸다.
const onSeen = new WeakMap()
let sharedObserver = null

function getObserver() {
  if (sharedObserver || typeof IntersectionObserver === 'undefined') return sharedObserver
  sharedObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      const callback = onSeen.get(entry.target)
      onSeen.delete(entry.target)
      sharedObserver.unobserve(entry.target)
      callback?.()
    }
  })
  return sharedObserver
}

export function useSeenOnce(ref) {
  // IntersectionObserver가 없는 환경이면 처음부터 보인 것으로 친다(그때는 loading="lazy"가 대신한다).
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const element = ref.current
    const observer = getObserver()
    if (seen || !element || !observer) return undefined
    onSeen.set(element, () => setSeen(true))
    observer.observe(element)
    return () => {
      onSeen.delete(element)
      observer.unobserve(element)
    }
  }, [ref, seen])

  return seen
}
