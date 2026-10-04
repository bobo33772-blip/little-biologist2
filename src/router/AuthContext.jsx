import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { isNativeApp } from '../utils/platform'
import { recordAttendance } from '../api/auth'

// 서버(/api/login, /api/signup)가 내려준 사용자 정보(id/uid/nickname)를 sessionStorage에
// 저장한다. 평문 비밀번호나 토큰은 여기 담기지 않는다 — 세션 동안 필요한 최소 정보만 유지.
//
// [수정] 이전에는 isAuthenticated가 순수 useState(false)라서 로그인 직후 새로고침만 해도
// ProtectedRoute가 즉시 /login으로 돌려보냈다. 지금은 sessionStorage에 로그인 여부만
// 저장해서, 탭을 유지한 채 새로고침해도 로그인 상태가 유지되도록 했다.
//
// 앱(Capacitor)에서는 앱 프로세스가 종료되면 sessionStorage가 비워져서, 앱을 껐다 켤 때마다 다시
// 로그인해야 했다. 그래서 앱에서만 localStorage에 저장해 로그인을 유지한다(웹은 탭 단위 유지 그대로).
const STORAGE_KEY = 'little-biologist-auth'
const NOTICE_KEY = 'little-biologist-auth-notice'
const AuthContext = createContext(null)

function authStorage() {
  return isNativeApp ? window.localStorage : window.sessionStorage
}

// React 바깥(api/userState.js 등)에서 로그인 상태를 강제로 끝내야 할 때 쓴다. 페이지를 새로 불러와서
// 각 Context에 남아 있던 기본값 상태까지 전부 비우고, 로그인 화면에서 이유를 안내할 수 있게 남겨둔다.
// uid를 넘기면, 그사이 로그아웃했거나 다른 계정으로 바뀐 경우엔 아무것도 하지 않는다.
export function forceRelogin(notice, uid) {
  if (uid && readStoredUser()?.uid !== uid) return
  try {
    authStorage().removeItem(STORAGE_KEY)
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
    const raw = authStorage().getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// 서버의 출석 날짜 기준(server/index.js의 todayDateKey: UTC)과 같은 오늘 날짜.
function utcDateKey() {
  return new Date().toISOString().slice(0, 10)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)
  // 이 화면에서 마지막으로 출석을 반영한 날짜. 방금 로그인했다면 /api/login이 이미 반영했다.
  const attendanceDateRef = useRef(null)

  // 출석 일수는 /api/login을 부를 때만 올라서, 로그인을 유지하는 앱에서는 매일 들어와도 멈춰 있게 된다.
  // 저장된 로그인으로 화면이 열리거나 다시 보일 때 하루 한 번 서버에 출석을 반영하고 최신 값으로 맞춘다.
  useEffect(() => {
    const uid = user?.uid
    if (!uid) return undefined
    const checkIn = () => {
      const today = utcDateKey()
      if (attendanceDateRef.current === today) return
      attendanceDateRef.current = today
      recordAttendance(uid)
        .then((totalLoginDays) => {
          if (totalLoginDays === null) return
          setUser((current) => {
            if (current?.uid !== uid || current.totalLoginDays === totalLoginDays) return current
            const next = { ...current, totalLoginDays }
            try {
              authStorage().setItem(STORAGE_KEY, JSON.stringify(next))
            } catch {
              // no-op
            }
            return next
          })
        })
        .catch(() => {
          // 서버가 잠들어 있었거나 네트워크 오류 — 다음에 화면이 다시 보일 때 재시도한다.
          if (attendanceDateRef.current === today) attendanceDateRef.current = null
        })
    }
    checkIn()
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkIn()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user?.uid])

  const login = (nextUser) => {
    attendanceDateRef.current = utcDateKey()
    setUser(nextUser)
    try {
      authStorage().setItem(STORAGE_KEY, JSON.stringify(nextUser))
    } catch {
      // 스토리지를 쓸 수 없는 환경(프라이빗 모드 등)에서도 로그인 자체는 계속 동작해야 한다.
    }
  }

  const logout = () => {
    setUser(null)
    try {
      authStorage().removeItem(STORAGE_KEY)
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
