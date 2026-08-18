import { createContext, useContext, useState } from 'react'

// 서버(/api/login, /api/signup)가 내려준 사용자 정보(id/uid/nickname)를 sessionStorage에
// 저장한다. 평문 비밀번호나 토큰은 여기 담기지 않는다 — 세션 동안 필요한 최소 정보만 유지.
//
// [수정] 이전에는 isAuthenticated가 순수 useState(false)라서 로그인 직후 새로고침만 해도
// ProtectedRoute가 즉시 /login으로 돌려보냈다. 지금은 sessionStorage에 로그인 여부만
// 저장해서, 탭을 유지한 채 새로고침해도 로그인 상태가 유지되도록 했다.
const STORAGE_KEY = 'little-biologist-auth'
const AuthContext = createContext(null)

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
