import { createElement, lazy, useState } from 'react'

// React.lazy에 '미리 받기'를 더한 래퍼. import()로 청크를 미리 받아 두기만 해서는 소용이 없다 —
// React.lazy는 처음 렌더될 때 모듈이 이미 와 있어도 한 번은 pending으로 시작해 Suspense 스피너를
// 한 프레임 커밋한다. 그래서 다 받아 둔 모듈은 lazy를 거치지 않고 컴포넌트를 바로 렌더한다.
export function lazyWithPreload(factory) {
  let Loaded = null
  let promise = null

  function load() {
    if (!promise) {
      promise = factory().then(
        (module) => {
          Loaded = module.default
          return module
        },
        (error) => {
          // 회선이 잠깐 끊겨 실패했으면 다음 미리받기·렌더 때 다시 받을 수 있게 비워 둔다.
          promise = null
          throw error
        },
      )
    }
    return promise
  }

  const Lazy = lazy(load)

  function Preloadable(props) {
    // 마운트 단위로 컴포넌트 정체성을 고정한다. 렌더 도중 Loaded가 채워져 Lazy→Loaded로
    // 바뀌면 React가 다른 컴포넌트로 보고 페이지를 통째로 다시 마운트하기 때문이다.
    const [Component] = useState(() => Loaded ?? Lazy)
    return createElement(Component, props)
  }

  Preloadable.preload = load
  return Preloadable
}
