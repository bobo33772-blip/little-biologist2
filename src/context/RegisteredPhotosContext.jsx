import { createContext, useContext, useEffect, useState } from 'react'
import { reportMissionEvent } from '../utils/missionEvents'
import { useAuth } from '../router/AuthContext'
import { fetchUserState, saveUserState } from '../api/userState'
import { playSfx } from '../utils/sound'
import { SFX } from '../utils/sfx'

// 탐험에서 사진/그림으로 등록에 성공한 곤충의 금(사진)·은(그림) 등급 이미지(dataURL)를
// species id별로 보관한다. 도감(FieldGuide)이 이 값을 읽어 등급 잠금 해제 + 실제 등록물 표시에 쓴다.
// 계정별 진행도라 로그인한 uid 기준으로 서버(user_state)에 저장한다.
const RegisteredPhotosContext = createContext(null)

const PHOTOS_KEY = 'photos'
const SKETCHES_KEY = 'sketches'
const BRONZE_KEY = 'bronzeUnlocks'
const REGISTRATIONS_KEY = 'registrations' // speciesId -> 최초 등록일(YYYY-MM-DD), 퀴즈의 "오늘 등록 카드 우선 출제"에 사용

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function RegisteredPhotosProvider({ children }) {
  const { user } = useAuth()
  const [photos, setPhotos] = useState({})
  const [sketches, setSketches] = useState({})
  const [bronzeUnlocks, setBronzeUnlocks] = useState({})
  const [registrations, setRegistrations] = useState({})

  useEffect(() => {
    if (!user?.uid) return
    let cancelled = false
    fetchUserState(user.uid).then((state) => {
      if (cancelled) return
      setPhotos(state[PHOTOS_KEY] || {})
      setSketches(state[SKETCHES_KEY] || {})
      setBronzeUnlocks(state[BRONZE_KEY] || {})
      setRegistrations(state[REGISTRATIONS_KEY] || {})
    })
    return () => {
      cancelled = true
    }
  }, [user?.uid])

  function recordFirstRegistration(speciesId) {
    setRegistrations((current) => {
      if (current[speciesId]) return current
      const next = { ...current, [speciesId]: getLocalDateKey() }
      if (user?.uid) saveUserState(user.uid, REGISTRATIONS_KEY, next)
      return next
    })
  }

  const registerGoldPhoto = (speciesId, dataUrl) => {
    playSfx(SFX.registerGold)
    if (!photos[speciesId]) reportMissionEvent({ type: 'field_guide_register', entityId: speciesId })
    reportMissionEvent({ type: 'photo_register', entityId: speciesId })
    reportMissionEvent({ type: 'rank_up', entityId: speciesId, rank: 'gold' })
    recordFirstRegistration(speciesId)
    setPhotos((current) => {
      const next = { ...current, [speciesId]: dataUrl }
      if (user?.uid) saveUserState(user.uid, PHOTOS_KEY, next)
      return next
    })
  }

  const registerSilverSketch = (speciesId, dataUrl) => {
    playSfx(SFX.registerSilver)
    if (!sketches[speciesId]) reportMissionEvent({ type: 'field_guide_register', entityId: speciesId })
    reportMissionEvent({ type: 'drawing_register', entityId: speciesId })
    reportMissionEvent({ type: 'rank_up', entityId: speciesId, rank: 'silver' })
    recordFirstRegistration(speciesId)
    setSketches((current) => {
      const next = { ...current, [speciesId]: dataUrl }
      if (user?.uid) saveUserState(user.uid, SKETCHES_KEY, next)
      return next
    })
  }

  // 목장에 출몰하는 랜덤곤충 이펙트를 눌러 얻는 동(기본) 등급 등록 — 종별로 한 번만 기록한다.
  // (부수효과는 setState updater 밖에서 한 번만 실행 — updater 안에 두면 StrictMode가 두 번
  // 호출할 때 효과음·미션 이벤트도 두 번 나갈 수 있다.)
  const registerBronze = (speciesId) => {
    if (bronzeUnlocks[speciesId]) return
    playSfx(SFX.registerBronze)
    reportMissionEvent({ type: 'field_guide_register', entityId: speciesId })
    recordFirstRegistration(speciesId)
    setBronzeUnlocks((current) => {
      const next = { ...current, [speciesId]: true }
      if (user?.uid) saveUserState(user.uid, BRONZE_KEY, next)
      return next
    })
  }

  return (
    <RegisteredPhotosContext.Provider
      value={{
        photos,
        registerGoldPhoto,
        sketches,
        registerSilverSketch,
        bronzeUnlocks,
        registerBronze,
        registrations,
      }}
    >
      {children}
    </RegisteredPhotosContext.Provider>
  )
}

export function useRegisteredPhotos() {
  const ctx = useContext(RegisteredPhotosContext)
  if (!ctx) throw new Error('useRegisteredPhotos must be used within RegisteredPhotosProvider')
  return ctx
}
