import { Component } from 'react'
import { useLocation } from 'react-router-dom'
import GameLoadingScreen from './GameLoadingScreen'

// 화면 JS(청크)를 못 받았을 때 흰 화면 대신 게임 장면으로 받아 주는 오류 경계.
//
// 배포 직후 예전 청크 파일이 사라졌거나 회선이 끊겨 import()가 실패하면, 브라우저는 그 실패를 문서의
// module map에 남겨 같은 주소를 다시 받지 않는다(같은 페이지에서는 몇 번을 다시 불러도 같은 실패).
// 그래서 다시 받으려면 새로고침이 유일한 방법이다 — 청크 실패면 한 번은 로딩 장면을 보여 주며 바로
// 새로고침하고, 그래도 실패하면(30초 안에 다시 실패) '다시 시도' 버튼을 띄운다.
//
// vite:preloadError에서 새로고침하지 않는 이유: 이 이벤트는 유휴 시간 미리받기(prefetchRoute)가
// 실패해도 나서, 거기서 새로고침하면 아이가 노는 도중에 화면이 갑자기 다시 시작된다. 실제로 그 화면을
// 그려야 할 때(이 경계에 오류가 왔을 때)만 새로고침한다.
const RELOAD_KEY = 'little-biologist:chunk-reload-at'
const RELOAD_GUARD_MS = 30000

const CHUNK_ERROR = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|Loading (CSS )?chunk/i

function isChunkLoadError(error) {
  return CHUNK_ERROR.test(String(error?.message ?? error ?? ''))
}

function readLastReload() {
  try {
    return Number(window.sessionStorage.getItem(RELOAD_KEY)) || 0
  } catch {
    return 0
  }
}

function writeLastReload(value) {
  try {
    if (value) window.sessionStorage.setItem(RELOAD_KEY, String(value))
    else window.sessionStorage.removeItem(RELOAD_KEY)
  } catch {
    // 저장소를 못 쓰는 환경이면 새로고침 반복 방지만 건너뛴다(새로고침은 자동으로 하지 않는다).
  }
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, reloading: false }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    if (!isChunkLoadError(error)) {
      console.error(error)
      return
    }
    const lastReload = readLastReload()
    if (Date.now() - lastReload < RELOAD_GUARD_MS) return
    writeLastReload(Date.now())
    // 저장이 안 되는 환경에서는 무한 새로고침이 될 수 있으므로 저장이 확인될 때만 자동으로 새로고침한다.
    if (readLastReload() === 0) return
    this.setState({ reloading: true })
    window.location.reload()
  }

  componentDidUpdate(prevProps) {
    // 다른 화면으로 옮기면(안드로이드 뒤로가기 등) 오류 화면을 거두고 다시 그려 본다.
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null, reloading: false })
    }
  }

  handleRetry = () => {
    writeLastReload(0)
    this.setState({ reloading: true })
    window.location.reload()
  }

  render() {
    const { error, reloading } = this.state
    if (!error) return this.props.children
    if (reloading) return <GameLoadingScreen />
    const chunkError = isChunkLoadError(error)
    return (
      <div className="lb-boot" role="alert">
        <div className="lb-boot__stage" aria-hidden="true">
          <span className="lb-boot__egg" />
          <span className="lb-boot__shadow" />
        </div>
        <p className="lb-boot__text">
          {chunkError ? '화면을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.' : '앗, 문제가 생겼어요.'}
        </p>
        <button
          type="button"
          onClick={this.handleRetry}
          className="mt-1 rounded-full bg-leaf-500 px-6 py-2.5 text-base font-bold text-white shadow-md transition-transform active:scale-95"
        >
          다시 시도
        </button>
      </div>
    )
  }
}

export default function ChunkErrorBoundary({ children }) {
  const { pathname } = useLocation()
  return <ErrorBoundary resetKey={pathname}>{children}</ErrorBoundary>
}
