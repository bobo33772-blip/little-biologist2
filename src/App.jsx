import { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './router/AuthContext'
import { CurrencyProvider } from './context/CurrencyContext'
import { BagProvider } from './context/BagContext'
import { RegisteredPhotosProvider } from './context/RegisteredPhotosContext'
import { QuestsProvider } from './context/QuestsContext'
import { TutorialProvider } from './context/TutorialContext'
import ProtectedRoute from './router/ProtectedRoute'
import { routes } from './router/routeChunks'
import GrowthStageModal from './components/common/GrowthStageModal'
import BackgroundMusicController from './components/common/BackgroundMusicController'
import ButtonSoundController from './components/common/ButtonSoundController'
import SoundAssetPreloader from './components/common/SoundAssetPreloader'
import GameLoadingScreen from './components/common/GameLoadingScreen'
import AndroidBackButtonHandler from './components/common/AndroidBackButtonHandler'
import RotateDeviceOverlay from './components/common/RotateDeviceOverlay'
import StandaloneViewportFix from './components/common/StandaloneViewportFix'

import AuthRouteLayout from './pages/auth/AuthRouteLayout'

// 라우트 단위 코드 스플리팅과 미리받기는 router/routeChunks.js 한 곳에서 관리한다.
const {
  login: Login,
  signup: Signup,
  ranch: Ranch,
  ranchHabitat: RanchHabitat,
  exploration: Exploration,
  fieldGuide: FieldGuide,
  quests: Quests,
  friends: Friends,
  friendRanch: FriendRanch,
  friendRanchHabitat: FriendRanchHabitat,
  friendFieldGuide: FriendFieldGuide,
  shop: Shop,
  bag: Bag,
  aiCompanion: AiCompanion,
  quiz: Quiz,
  profile: Profile,
} = routes

// 첫 주소(/)는 로그인 상태에 따라 나눈다. 앱(Capacitor)과 홈 화면 웹 앱은 항상 /에서 시작하는데,
// 로그인을 기기에 유지해도 무조건 /login으로 보내면 열 때마다 로그인 화면이 떠서 유지가 의미 없어진다.
function RootRedirect() {
  const { isAuthenticated } = useAuth()
  // 곧 그릴 첫 화면의 청크를 Navigate가 커밋되기 전에 받기 시작한다(이미 받는 중이면 같은 요청을 쓴다).
  if (isAuthenticated) routes.ranch.preload().catch(() => {})
  else routes.login.preload().catch(() => {})
  // Navigate는 아무것도 그리지 않고 effect에서 이동하므로, 그 사이 한 프레임이 빈 아이보리 화면이 된다.
  // index.html 스플래시와 같은 로딩 장면을 함께 그려 다음 대기 화면으로 끊김 없이 넘긴다.
  return (
    <>
      <GameLoadingScreen />
      <Navigate to={isAuthenticated ? '/ranch' : '/login'} replace />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
      <QuestsProvider>
      <BagProvider>
      <RegisteredPhotosProvider>
      <TutorialProvider>
      <BackgroundMusicController />
      <ButtonSoundController />
      <SoundAssetPreloader />
      <GrowthStageModal />
      <AndroidBackButtonHandler />
      <RotateDeviceOverlay />
      <StandaloneViewportFix />
      {/* 화면 JS를 기다리는 동안은 스피너 대신 index.html 스플래시와 같은 게임 로딩 장면을 보여 준다. */}
      <Suspense fallback={<GameLoadingScreen />}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route element={<AuthRouteLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        <Route path="/ranch" element={<ProtectedRoute><Ranch /></ProtectedRoute>} />
        <Route path="/ranch/:habitatId" element={<ProtectedRoute><RanchHabitat /></ProtectedRoute>} />
        <Route path="/exploration" element={<ProtectedRoute><Exploration /></ProtectedRoute>} />
        <Route path="/field-guide" element={<ProtectedRoute><FieldGuide /></ProtectedRoute>} />
        <Route path="/quests" element={<ProtectedRoute><Quests /></ProtectedRoute>} />
        <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
        <Route path="/friends/ranch/:uid" element={<ProtectedRoute><FriendRanch /></ProtectedRoute>} />
        <Route path="/friends/ranch/:uid/:habitatId" element={<ProtectedRoute><FriendRanchHabitat /></ProtectedRoute>} />
        <Route path="/friends/field-guide/:uid" element={<ProtectedRoute><FriendFieldGuide /></ProtectedRoute>} />
        <Route path="/shop" element={<ProtectedRoute><Shop /></ProtectedRoute>} />
        <Route path="/bag" element={<ProtectedRoute><Bag /></ProtectedRoute>} />
        <Route path="/ai-companion" element={<ProtectedRoute><AiCompanion /></ProtectedRoute>} />
        <Route path="/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/edit" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      </Suspense>
      </TutorialProvider>
      </RegisteredPhotosProvider>
      </BagProvider>
      </QuestsProvider>
      </CurrencyProvider>
    </AuthProvider>
  )
}
