import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { createPortal, flushSync } from 'react-dom'
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import SceneCurtain, { discGeometry, viewportCenter } from './SceneCurtain'
import { EASE, EASE_POINTS, IRIS, IRIS_REDUCED, SCENE_TRANSITIONS_ENABLED, bezierTimeForProgress, usePrefersReducedMotion } from '../../utils/motion'
import { prefetchRoute, routeKeyForPath } from '../../router/routeChunks'
import { HABITAT_SCENES } from '../../data/habitatScenes'
import { isNativeApp, isStandaloneWebApp } from '../../utils/platform'

// 장소 전환 원형 커튼(목장↔서식지 전용).
// 들어가기: 탭한 서식지 자리에서 그 서식지 색의 원이 퍼져 화면을 덮고, 다 덮인 순간 이동한 뒤 다음 장면
// 그림이 준비되면(markReady, 상한 2.2초) 커튼 전체가 옅어진다.
// 나오기: 화면 가운데에서 덮고, 목장에 도착하면 원이 방금 떠난 서식지 대객체 자리로 접혀 들어가며 지도가 드러난다.
// 자주 오가는 다른 화면 이동에는 쓰지 않는다(이동을 늦추지 않으려고).
//
// 상태는 idle → covering → covered → revealing → idle이고, 타이머·애니메이션 같은 바뀌는 값은 렌더와 무관한
// SceneMachine 하나가 들고 있다. React state는 커튼 모양(view)과 도착 화면이 읽는 값만 둔다.

const SceneTransitionContext = createContext(null)

const HABITAT_PATH = /^\/ranch\/([^/]+)\/?$/

// 원이 화면을 다 덮는 시점(덮기 시간 대비 비율). 원을 coverOverscan배 크게 그리므로 scale이 1/coverOverscan에
// 닿는 순간 네 모서리까지 덮인다.
const FULL_COVER_FRACTION = bezierTimeForProgress(EASE_POINTS.cover, 1 / IRIS.coverOverscan)

// 뒤로가기(POP)로 서식지→목장에 올 때 '열기만 하는' 연출은 앱과 홈 화면 웹 앱에서만 한다. 브라우저 탭은
// Safari 스와이프 뒤로가기의 자체 전환과 겹치므로 원래대로 둔다(웹 동작 유지).
const OPEN_ON_POP = isNativeApp || isStandaloneWebApp

function pathOf(to) {
  const path = typeof to === 'string' ? to : to?.pathname ?? ''
  return path.split(/[?#]/)[0]
}

let runSeq = 0

class SceneMachine {
  constructor({ setView, setArrivedVia, setLastRevealAt }) {
    this.setView = setView
    this.setArrivedVia = setArrivedVia
    this.setLastRevealAt = setLastRevealAt
    this.run = null
    this.latest = { navigate: null, location: null, reducedMotion: false }
    this.arrivedTimer = 0
    // 도착 화면이 걷기 원점(화면 좌표)을 넣는다. 없으면 화면 가운데로 걷는다.
    this.revealOriginRef = { current: null }
    this.rootRef = { current: null }
    this.discRef = { current: null }
    this.labelRef = { current: null }
    this.go = this.go.bind(this)
    this.markReady = this.markReady.bind(this)
  }

  sync(latest) {
    this.latest = latest
  }

  // 이 전환이 아직 진행 중일 때만 실행되는 타이머. 전환이 끝나면 한꺼번에 해제한다.
  later(run, callback, delayMs) {
    const id = window.setTimeout(() => {
      run.timers.delete(id)
      if (this.run === run) callback()
    }, delayMs)
    run.timers.add(id)
  }

  clearRun(run) {
    run.timers.forEach((id) => window.clearTimeout(id))
    run.timers.clear()
    if (run.raf) cancelAnimationFrame(run.raf)
    run.raf = 0
  }

  go(to, options = {}) {
    const { kind, origin = null, color = '#0F1F17', label = null, state, replace = false, prepare, beforeNavigate, source = 'user' } = options
    const navigateNow = () => {
      beforeNavigate?.()
      this.latest.navigate(to, { state, replace })
    }
    if (!SCENE_TRANSITIONS_ENABLED || kind !== 'iris') {
      navigateNow()
      return
    }
    if (this.run?.phase === 'revealing' && source === 'user') {
      // 걷히는 중에는 커튼이 이미 입력을 통과시킨다(pointer-events:none). 이때 누른 탭까지 버리면 버튼은
      // 눌린 것처럼 보이는데 아무 일도 없어서 아이가 다시 눌러야 했다(리뷰에서 재현). 걷던 커튼을 바로
      // 끝내고 새 전환을 시작한다. 탭은 이벤트 핸들러에서 오므로 finish의 flushSync가 안전하다.
      this.finish(this.run)
    }
    if (this.run) {
      // 덮는 중·덮인 동안 아이가 연타한 요청은 버린다. 프로그램이 부른 이동은 튜토리얼 진행·미션 보고 같은
      // 콜백이 버려지지 않게 커튼과 상관없이 바로 실행한다.
      if (source === 'program') navigateNow()
      return
    }
    // 같은 경로로의 이동은 장면이 바뀌지 않으므로 커튼 없이 그대로 보낸다.
    if (pathOf(to) === this.latest.location?.pathname) {
      navigateNow()
      return
    }

    // 덮는 300ms 동안 다음 화면 JS와 그림을 미리 받는다.
    prefetchRoute(routeKeyForPath(pathOf(to)))
    Promise.resolve().then(prepare).catch(() => {})

    const direction = options.direction ?? (pathOf(to) === '/ranch' ? 'out' : 'in')
    const reduced = this.latest.reducedMotion
    this.revealOriginRef.current = null
    window.clearTimeout(this.arrivedTimer)
    const run = {
      id: `go:${(runSeq += 1)}`,
      to,
      state,
      replace,
      beforeNavigate,
      direction,
      reduced,
      phase: 'covering',
      navigated: false,
      aborted: false,
      ready: false,
      fromKey: null,
      timers: new Set(),
      raf: 0,
    }
    this.run = run
    this.later(run, () => this.watchdog(run), IRIS.watchdogMs)
    this.setView({ id: run.id, mode: 'go', phase: 'covering', color, label, origin, reduced, showHop: false })
  }

  // 커튼이 DOM에 그려진 직후(페인트 전) 불린다.
  onViewCommitted(view) {
    if (!view) return
    const run = this.run
    if (view.mode === 'pop') {
      if (!run) this.adoptPop(view)
      return
    }
    if (!run || run.id !== view.id) return
    if (view.phase === 'covering' && !run.coverStarted) {
      run.coverStarted = true
      this.startCover(run)
    }
  }

  // 뒤로가기로 이미 목장에 와 있는 상태라 덮기와 이동은 건너뛰고 기다리기부터 시작한다.
  adoptPop(view) {
    window.clearTimeout(this.arrivedTimer)
    const run = {
      id: view.id,
      direction: 'out',
      reduced: view.reduced,
      phase: 'covered',
      navigated: true,
      aborted: false,
      ready: false,
      fromKey: null,
      timers: new Set(),
      raf: 0,
    }
    this.run = run
    this.later(run, () => this.watchdog(run), IRIS.watchdogMs)
    this.beginWait(run)
  }

  startCover(run) {
    const root = this.rootRef.current
    const disc = this.discRef.current
    const label = this.labelRef.current
    let animation = null
    let duration = run.reduced ? IRIS_REDUCED.coverMs : run.direction === 'in' ? IRIS.coverInMs : IRIS.coverOutMs
    if (run.reduced) {
      // 모션 줄이기: 원 없이 같은 색 화면 전체가 짧게 짙어진다.
      animation = root?.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration, easing: EASE.out }) ?? null
    } else if (disc) {
      // 끝 상태를 먼저 기본값으로 둔다 — 애니메이션이 끝나 효과가 빠져도 그대로 다 덮인 상태로 남는다.
      disc.style.transform = 'scale(1)'
      disc.style.willChange = 'transform'
      animation = disc.animate?.([{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration, easing: EASE.cover }) ?? null
      label?.animate?.([{ opacity: 0 }, { opacity: 1 }], {
        duration: IRIS.labelFadeMs,
        delay: IRIS.labelDelayMs,
        easing: EASE.out,
        fill: 'backwards',
      })
    }
    if (!animation) duration = 0
    run.animation = animation
    if (animation) {
      animation.onfinish = () => {
        // will-change는 움직이는 동안에만 둔다.
        if (disc) disc.style.willChange = ''
        this.onCovered(run)
      }
      // 원은 화면이 다 덮인 뒤에도 조금 더 퍼진다(coverOverscan). 다 덮인 순간 바로 이동해서 다음 화면을
      // 그리는 시간을 남은 퍼짐 아래에 숨긴다. 원 애니메이션은 합성 단계에서 돌아 그리는 동안에도 끊기지 않는다.
      // '다 덮인 순간'은 타이머가 아니라 애니메이션 자신의 시간(currentTime)으로 판단한다 — ready 뒤 타이머는
      // 실제 시작보다 한 프레임쯤 일찍 재기 시작해서, 모서리가 덜 덮인 채 이동한 적이 있다(실측).
      if (!run.reduced) {
        const coveredAtMs = duration * FULL_COVER_FRACTION
        const poll = () => {
          run.raf = 0
          if (this.run !== run || run.phase !== 'covering') return
          if (Number(animation.currentTime ?? 0) >= coveredAtMs) {
            this.onCovered(run)
            return
          }
          run.raf = requestAnimationFrame(poll)
        }
        run.raf = requestAnimationFrame(poll)
      }
    }
    // 애니메이션 끝 신호가 안 와도(탭이 가려지는 등) 다음 단계로 넘어간다.
    this.later(run, () => this.onCovered(run), duration + (animation ? IRIS.safetyExtraMs : 0))
  }

  onCovered(run) {
    if (this.run !== run || run.phase !== 'covering') return
    run.phase = 'covered'
    // 애니메이션 콜백은 React 이벤트 밖이라 그냥 두면 이동이 1~2프레임 뒤에 그려진다. 다 덮인 화면 아래에서
    // 바로 그려 두어야 기다림이 줄어든다(캐시가 있으면 탭부터 걷힘 끝까지 700ms 예산).
    flushSync(() => {
      this.navigateRun(run)
      this.setView((view) => (view && view.id === run.id ? { ...view, phase: 'covered' } : view))
    })
    this.beginWait(run)
  }

  // 다 덮인 순간 같은 틱에 콜백(튜토리얼 advance·미션 보고)과 이동을 함께 부른다. 그래야 튜토리얼의
  // 자동 replace가 '아직 목장인데 단계는 넘어간' 틈에 끼어들지 않는다.
  navigateRun(run) {
    if (run.navigated) return
    run.navigated = true
    run.fromKey = this.latest.location?.key ?? null
    window.clearTimeout(this.arrivedTimer)
    this.setArrivedVia('iris')
    try {
      run.beforeNavigate?.()
    } catch (error) {
      console.error(error)
    }
    this.latest.navigate(run.to, { state: run.state, replace: run.replace })
  }

  // 위치가 자리 잡고(location.key가 연속 2 rAF 동안 그대로) 도착 화면이 그림 준비를 알리면 걷는다.
  // 튜토리얼 replace처럼 덮인 동안 주소가 또 바뀌면 새 주소 기준으로 다시 기다린다.
  beginWait(run) {
    this.later(run, () => {
      this.setView((view) => (view && view.id === run.id && view.phase === 'covered' ? { ...view, showHop: true } : view))
    }, IRIS.hopAfterMs)
    this.later(run, () => this.reveal(run), IRIS.waitCapMs)
    let lastKey = run.fromKey
    let stableFrames = 0
    const tick = () => {
      run.raf = 0
      if (this.run !== run || run.phase !== 'covered') return
      const key = this.latest.location?.key ?? null
      if (key !== lastKey) {
        lastKey = key
        stableFrames = 0
      } else {
        stableFrames += 1
      }
      // 준비 신호는 지금 경로에서 보낸 것만 센다 — 덮인 동안 튜토리얼 replace 등으로 다른 화면으로 또
      // 바뀌었는데 앞 화면의 신호로 걷으면, 새 화면이 그림 없이 드러난다. 같은 경로에서 state만 바뀐
      // replace는 화면이 다시 마운트되지 않아 신호를 다시 보내지 않으므로 경로로 비교한다.
      const pathname = this.latest.location?.pathname ?? null
      if (key !== run.fromKey && stableFrames >= 1 && run.ready && run.readyPath === pathname) {
        this.reveal(run)
        return
      }
      run.raf = requestAnimationFrame(tick)
    }
    run.raf = requestAnimationFrame(tick)
  }

  // 도착 화면이 장면 그림을 다 준비했을 때 부른다. 이동한 뒤에 온 신호만 받는다(떠나는 화면이 보낸 신호 무시).
  markReady() {
    const run = this.run
    if (!run || !run.navigated || run.phase !== 'covered') return
    run.ready = true
    run.readyPath = this.latest.location?.pathname ?? null
  }

  watchdog(run) {
    if (run.phase === 'covering' || run.phase === 'covered') this.reveal(run)
  }

  reveal(run) {
    if (this.run !== run || run.phase === 'revealing') return
    run.animation?.cancel?.()
    // 감시 타이머가 덮기 도중에 걸린 경우에도 콜백과 이동은 버리지 않는다.
    if (!run.navigated && !run.aborted) this.navigateRun(run)
    run.phase = 'revealing'
    this.clearRun(run)

    const root = this.rootRef.current
    const disc = this.discRef.current
    let animation = null
    let duration = 0
    let origin = null
    if (!run.reduced && run.direction === 'out' && disc) {
      // 원 중심을 떠난 서식지 자리로 옮긴다(그 점에서도 화면을 다 덮는 크기라 옮기는 순간은 보이지 않는다).
      // 그 점으로 접혀 들어가고, 마지막 30%에서 옅어진다.
      origin = this.revealOriginRef.current ?? viewportCenter()
      const geometry = discGeometry(origin)
      Object.assign(disc.style, {
        left: `${geometry.left}px`,
        top: `${geometry.top}px`,
        width: `${geometry.width}px`,
        height: `${geometry.height}px`,
        transform: 'scale(0)',
        opacity: '0',
        willChange: 'transform, opacity',
      })
      duration = IRIS.revealOutMs
      animation = disc.animate?.(
        [
          { transform: 'scale(1)', opacity: 1, offset: 0 },
          { opacity: 1, offset: 0.7 },
          { transform: 'scale(0)', opacity: 0, offset: 1 },
        ],
        { duration, easing: EASE.arrive },
      ) ?? null
    } else if (root) {
      duration = run.reduced ? IRIS_REDUCED.revealMs : IRIS.revealInMs
      root.style.opacity = '0'
      if (!run.reduced) root.style.willChange = 'opacity'
      animation = root.animate?.([{ opacity: 1 }, { opacity: 0 }], { duration, easing: run.reduced ? EASE.out : EASE.arrive }) ?? null
    }
    if (!animation) duration = 0
    this.setView((view) => (view && view.id === run.id ? { ...view, phase: 'revealing', ...(origin ? { origin } : null) } : view))
    if (animation) animation.onfinish = () => this.finish(run)
    this.later(run, () => this.finish(run), duration + (animation ? IRIS.safetyExtraMs : 0))
  }

  finish(run) {
    if (this.run !== run) return
    this.clearRun(run)
    this.run = null
    // 다 걷힌 커튼은 다음 프레임을 기다리지 않고 바로 DOM에서 뺀다.
    flushSync(() => {
      this.setView(null)
      this.setLastRevealAt(performance.now())
    })
    // 취소된 전환(덮는 중 뒤로가기 등)이어도 앞 전환이 남긴 arrivedVia='iris'가 남지 않게 늘 되돌린다.
    // 남아 있으면 이후 목장 도착 페이드가 계속 생략됐다.
    window.clearTimeout(this.arrivedTimer)
    this.arrivedTimer = window.setTimeout(() => this.setArrivedVia(null), run.navigated && !run.aborted ? IRIS.arrivedHoldMs : 0)
  }

  // 커튼이 덮인 동안 바깥에서 주소가 바뀐 경우. 덮는 중(이동 전)이면 이동을 취소하고 걷고, 이동한 뒤라면
  // 뒤로가기(POP)나 로그인 화면 이동(세션 만료 등)일 때 바로 걷는다.
  onLocationChange(location, navigationType) {
    const run = this.run
    if (!run || run.phase === 'revealing') return
    if (!run.navigated) {
      run.aborted = true
      this.reveal(run)
      return
    }
    if (navigationType === 'POP' || location.pathname === '/login') this.reveal(run)
  }

  dispose() {
    if (this.run) this.clearRun(this.run)
    window.clearTimeout(this.arrivedTimer)
  }
}

export function SceneTransitionProvider({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const navigationType = useNavigationType()
  const reducedMotion = usePrefersReducedMotion()
  const [view, setView] = useState(null)
  const [arrivedVia, setArrivedVia] = useState(null)
  const [lastRevealAt, setLastRevealAt] = useState(-Infinity)
  const [machine] = useState(() => new SceneMachine({ setView, setArrivedVia, setLastRevealAt }))
  const [seenLocation, setSeenLocation] = useState({ key: location.key, pathname: location.pathname })

  // 앱·홈 화면 웹 앱에서 서식지 → 목장 뒤로가기(POP): 목장이 처음 그려지기 전(렌더 중)에 '다 덮인' 상태로
  // 시작해서, 목장이 준비되면 그 서식지 자리로 접혀 들어가며 열린다. 렌더 중에 정해야 목장의 첫 렌더가
  // arrivedVia='iris'를 보고 목장 준비 커튼·도착 연출을 겹쳐 띄우지 않는다.
  if (seenLocation.key !== location.key) {
    setSeenLocation({ key: location.key, pathname: location.pathname })
    const fromHabitatId = HABITAT_PATH.exec(seenLocation.pathname)?.[1]
    if (
      SCENE_TRANSITIONS_ENABLED &&
      OPEN_ON_POP &&
      navigationType === 'POP' &&
      view === null &&
      location.pathname === '/ranch' &&
      HABITAT_SCENES[fromHabitatId]
    ) {
      setView({
        id: `pop:${location.key}`,
        mode: 'pop',
        phase: 'covered',
        color: HABITAT_SCENES[fromHabitatId].coverColor,
        label: null,
        origin: null,
        reduced: reducedMotion,
        showHop: false,
      })
      setArrivedVia('iris')
    }
  }

  useLayoutEffect(() => {
    machine.sync({ navigate, location, reducedMotion })
  })

  // 아래 두 effect는 순서가 중요하다: 주소 변화를 먼저 보고, 그다음 새 커튼을 시작한다.
  useLayoutEffect(() => {
    machine.onLocationChange(location, navigationType)
  }, [machine, location, navigationType])

  useLayoutEffect(() => {
    machine.onViewCommitted(view)
  }, [machine, view])

  useEffect(() => () => machine.dispose(), [machine])

  const isRevealed = !view || view.phase === 'revealing'
  const value = useMemo(
    () => ({
      go: machine.go,
      markReady: machine.markReady,
      revealOriginRef: machine.revealOriginRef,
      arrivedVia,
      lastRevealAt,
      isRevealed,
    }),
    [machine, arrivedVia, lastRevealAt, isRevealed],
  )

  return (
    <SceneTransitionContext.Provider value={value}>
      {children}
      {view &&
        createPortal(
          <SceneCurtain view={view} rootRef={machine.rootRef} discRef={machine.discRef} labelRef={machine.labelRef} />,
          document.body,
        )}
    </SceneTransitionContext.Provider>
  )
}

// go(to, { kind:'iris', origin, color, label, state, replace, prepare, beforeNavigate, source }),
// markReady(), revealOriginRef, arrivedVia('iris'|null), lastRevealAt
export function useSceneTransition() {
  const context = useContext(SceneTransitionContext)
  if (!context) throw new Error('useSceneTransition must be used within SceneTransitionProvider')
  return context
}

// 진행 중인 장면 전환이 없으면 true. 커튼이 덮여 있는 동안 false였다가 걷기가 시작되면 true가 된다.
// 커튼 아래에서 먼저 시작하면 안 되는 연출(서식지 이름 배너 등)이 이 값을 기다린다.
export function useSceneRevealed() {
  return useSceneTransition().isRevealed
}
