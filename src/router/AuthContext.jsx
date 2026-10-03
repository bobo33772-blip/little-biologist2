import { createContext, useContext, useState } from 'react'

// 서버(/api/login, /api/signup)가 내려준 사용자 정보(id/uid/nickname)를 sessionStorage에
// 저장한다. 평문 비밀번호나 토큰은 여기 담기지 않는다 — 세션 동안 필요한 최소 정보만 유지.
//
// [수정] 이전에는 isAuthenticated가 순수 useState(false)라서 로그인 직후 새로고침만 해도
// ProtectedRoute가 즉시 /login으로 돌려보냈다. 지금은 sessionStorage에 로그인 여부만
// 저장해서, 탭을 유지한 채 새로고침해도 로그인 상태가 유지되도록 했다.
const STORAGE_KEY = 'little-biologist-auth'
const NOTICE_KEY = 'little-biologist-auth-notice'
const AuthContext = createContext(null)

// React 바깥(api/userState.js 등)에서 로그인 상태를 강제로 끝내야 할 때 쓴다. 페이지를 새로 불러와서
// 각 Context에 남아 있던 기본값 상태까지 전부 비우고, 로그인 화면에서 이유를 안내할 수 있게 남겨둔다.
// uid를 넘기면, 그사이 로그아웃했거나 다른 계정으로 바뀐 경우엔 아무것도 하지 않는다.
export function forceRelogin(notice, uid) {
  if (uid && readStoredUser()?.uid !== uid) return
  try {
    sessionStorage.removeItem(STORAGE_KEY)
    sessionStorage.setItem(NOTICE_KEY, notice)
  } catch {
    // no-op
  }
  window.location.replace('/')
}

// 로그인 화면이 첫 렌더에서 읽고(readAuthNotice), 마운트 직후 지운다(clearAuthNotice).
export function readAuthNotice() {
  try {
    return sessionStorage.getItem(NOTICE_KEY)
  } catch {
    return null
  }
}

export function clearAuthNotice() {
  try {
    sessionStorage.removeItem(NOTICE_KEY)
  } catch {
    // no-op
  }
}

function readStoredUser() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)

  const login = (nextUser) => {
    setUser(nextUser)
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
    } catch {
      // 스토리지를 쓸 수 없는 환경(프라이빗 모드 등)에서도 로그인 자체는 계속 동작해야 한다.
    }
  }

  const logout = () => {
    setUser(null)
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // no-op
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated: Boolean(user), user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
