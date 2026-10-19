import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User, Lock, Sprout } from 'lucide-react'
import { useAuth } from '../../router/AuthContext'
import { postAuth } from '../../api/auth'
import AuthToast from './AuthToast'
import { RANCH_SCENE_IMAGES } from '../../data/insectSpecies'
import { preloadImages } from '../../utils/preloadImages'
import { prefetchRoute } from '../../router/routeChunks'

function getSignupErrorMessage(status) {
  if (status === 409) return '이미 사용 중인 아이디예요.'
  if (status === 400) return '아이디, 비밀번호, 닉네임을 모두 입력해주세요.'
  // 응답만 늦었을 뿐 가입 자체는 됐을 수 있다 — 다시 가입하면 "이미 사용 중"이 뜨므로 로그인을 권한다.
  if (status === 'timeout') return '응답이 늦어요. 가입이 됐을 수도 있으니 먼저 로그인해보세요.'
  return '서버가 잠시 응답하지 않아요. 잠시 후 다시 시도해주세요.'
}

export default function SignupForm() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!username || !password || !nickname || status === 'loading') return
    setStatus('loading')
    setToast(null)
    // 응답을 기다리는 동안 목장 그림과 JS를 미리 받아 둔다 — 도착하면 목장 준비 커튼이 금방 걷힌다.
    preloadImages(RANCH_SCENE_IMAGES)
    prefetchRoute('ranch')
    const result = await postAuth('/api/signup', { username, password, nickname })
    setStatus('idle')
    if (!result.ok || !result.data.user) {
      setToast({ type: 'error', message: getSignupErrorMessage(result.status) })
      return
    }
    login(result.data.user)
    navigate('/ranch', { state: { firstLogin: true } })
  }

  return (
    <>
      <AuthToast type={toast?.type} message={toast?.message} />

      <div className="mx-auto mb-2 flex w-fit items-center rounded-full bg-gradient-to-b from-lime-300 to-lime-500 px-5 py-2 shadow-[0_4px_0_0_#3f6212]">
        <h2 className="whitespace-nowrap font-['Jua'] text-base font-bold text-bark-800">
          닉네임을 정하고 알을 만나보세요
        </h2>
      </div>

      <form className="flex flex-col gap-2.5" onSubmit={handleSubmit} noValidate>
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-bark-800">아이디</span>
          <div className="flex items-center gap-2 rounded-2xl border-2 border-emerald-400/80 bg-white/70 px-4 py-3">
            <User size={22} className="shrink-0 text-emerald-700" aria-hidden="true" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디를 입력해주세요"
              autoComplete="username"
              className="w-full bg-transparent text-base text-bark-800 outline-none placeholder:text-bark-400"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-bold text-bark-800">비밀번호</span>
          <div className="flex items-center gap-2 rounded-2xl border-2 border-emerald-400/80 bg-white/70 px-4 py-3">
            <Lock size={22} className="shrink-0 text-emerald-700" aria-hidden="true" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력해주세요"
              autoComplete="new-password"
              className="w-full bg-transparent text-base text-bark-800 outline-none placeholder:text-bark-400"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-bold text-bark-800">닉네임</span>
          <div className="flex items-center gap-2 rounded-2xl border-2 border-emerald-400/80 bg-white/70 px-4 py-3">
            <Sprout size={22} className="shrink-0 text-emerald-700" aria-hidden="true" />
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임을 입력해주세요"
              className="w-full bg-transparent text-base text-bark-800 outline-none placeholder:text-bark-400"
            />
          </div>
        </label>

        <button
          type="submit"
          disabled={status === 'loading'}
          className="mt-1 flex items-center justify-center gap-2 rounded-full bg-gradient-to-b from-lime-500 to-emerald-700 px-4 py-3.5 text-lg font-extrabold text-white shadow-[0_6px_0_0_#3f6212] [text-shadow:0_1px_2px_rgba(0,0,0,0.25)] transition-transform active:translate-y-1.5 active:shadow-[0_2px_0_0_#3f6212] disabled:opacity-60 disabled:active:translate-y-0 disabled:active:shadow-[0_6px_0_0_#3f6212]"
        >
          {status === 'loading' ? '가입하는 중...' : '가입하고 알 만나기'}
        </button>

        <Link
          to="/login"
          className="flex items-center justify-center rounded-2xl border-2 border-lime-400 bg-lime-100/90 py-3 text-base font-bold text-emerald-900 shadow-sm transition-all hover:bg-lime-200"
        >
          이미 계정이 있으신가요? 로그인
        </Link>
      </form>
    </>
  )
}
