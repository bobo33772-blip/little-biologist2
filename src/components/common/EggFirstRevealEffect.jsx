import { useEffect, useState } from 'react'
import { getRepresentativeCharacterImage } from '../../data/representativeCharacter'
import { playSfx } from '../../utils/sound'
import { SFX } from '../../utils/sfx'

const REVEAL_FADE_MS = 700 // 큰 사진이 나타나고/사라지는 페이드 시간
const REVEAL_HOLD_MS = 2000 // 큰 사진을 완전히 보여준 채로 유지하는 시간
const FALLBACK_EGG_IMAGE = '/ui/egg-clean.png'

// 이 모달이 닫힌 뒤에야 튜토리얼이 시작되도록(TutorialContext.jsx) 알려주는 이벤트.
export const EGG_GRANT_CLOSED_EVENT = 'little-biologist-egg-grant-closed'

// 회원가입 직후 처음 목장에 들어왔을 때, 새로 배정된 알을 랜덤곤충 발견 이펙트(RandomInsectEffect)와
// 같은 연출(페이드인 → 유지 → 페이드아웃)로 한 번 크게 보여준 뒤 소개 팝업을 띄운다.
// SignupForm.jsx가 navigate state로 넘기는 firstLogin이 있을 때 딱 한 번만 실행된다.
//
// 타이머 예약과 해제를 반드시 같은 이펙트 안에서 짝지어야 한다 — 예전엔 해제를 별도의
// 마운트 전용 이펙트(deps: [])에 뒀는데, 개발 모드 StrictMode가 마운트 직후 이펙트를 한 번
// 더(정리→재실행) 돌리면서 방금 예약한 타이머가 그 정리 단계에서 바로 취소되고, "한 번만
// 실행" 가드 때문에 다시 예약되지도 않아 연출이 통째로 안 뜨는 버그가 있었다.
export default function EggFirstRevealEffect({ trigger, representativeCharacter, onActiveChange }) {
  const [isRevealing, setIsRevealing] = useState(false)
  const [isRevealVisible, setIsRevealVisible] = useState(false)
  const [isIntroOpen, setIsIntroOpen] = useState(false)

  useEffect(() => {
    if (!trigger) return undefined
    setIsRevealing(true)
    setIsRevealVisible(false)
    setIsIntroOpen(false)
    const fadeInTimer = window.setTimeout(() => setIsRevealVisible(true), 20)
    const fadeOutTimer = window.setTimeout(() => setIsRevealVisible(false), 20 + REVEAL_HOLD_MS)
    const finishTimer = window.setTimeout(() => {
      setIsRevealing(false)
      setIsIntroOpen(true)
      playSfx(SFX.newEgg)
    }, 20 + REVEAL_HOLD_MS + REVEAL_FADE_MS)
    return () => {
      window.clearTimeout(fadeInTimer)
      window.clearTimeout(fadeOutTimer)
      window.clearTimeout(finishTimer)
    }
  }, [trigger])

  // 목장 화면의 다른 연출(튜토리얼 등)이 이 알 획득 흐름과 겹치지 않도록, 지금 떠 있는지를
  // 부모(Ranch.jsx)에게 알려준다.
  useEffect(() => {
    onActiveChange?.(Boolean(isRevealing || isIntroOpen))
  }, [isIntroOpen, isRevealing, onActiveChange])

  const eggImage = getRepresentativeCharacterImage(representativeCharacter) ?? FALLBACK_EGG_IMAGE

  function closeIntro() {
    setIsIntroOpen(false)
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent(EGG_GRANT_CLOSED_EVENT))
    }, 120)
  }

  return (
    <>
      {isRevealing && (
        <div className={`ranch-catch-reveal ${isRevealVisible ? 'is-visible' : ''}`} aria-hidden="true">
          <img src={eggImage} alt="" className="ranch-catch-reveal__image" />
        </div>
      )}

      {isIntroOpen && (
        <div className="fixed inset-0 z-[110] grid place-items-center bg-ink-900/45 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="알 획득 안내">
          <div className="egg-grant-modal w-full max-w-sm overflow-hidden rounded-[1.75rem] bg-amber-50 text-center shadow-2xl ring-2 ring-lime-200 sm:max-w-md">
            <div className="bg-gradient-to-b from-lime-200 to-amber-50 px-5 pb-4 pt-6 sm:px-7">
              <p className="text-sm font-black text-leaf-700">새로운 친구가 찾아왔어요</p>
              <h2 className="mt-1 text-2xl font-black text-ink-900">알을 얻었습니다.</h2>
            </div>

            <div className="px-5 pb-5 sm:px-7">
              <div className="relative mx-auto -mt-1 grid h-40 w-40 place-items-center sm:h-44 sm:w-44">
                <span className="absolute inset-x-8 bottom-5 h-5 rounded-full bg-ink-900/10 blur-sm" aria-hidden="true" />
                <img src={eggImage} alt="새로 얻은 알" className="egg-grant-modal__egg relative h-full w-full object-contain" />
              </div>

              <section className="relative mt-2 rounded-2xl border-2 border-lime-200 bg-white/90 px-4 py-4 text-left shadow-sm">
                <span className="absolute -top-3 left-1/2 h-5 w-5 -translate-x-1/2 rotate-45 border-l-2 border-t-2 border-lime-200 bg-white" aria-hidden="true" />
                <h3 className="text-lg font-black text-ink-900">리틀 바이올로지스트에 온 걸 환영해!</h3>
                <p className="mt-2 text-sm font-bold leading-6 text-ink-700/85">
                  반가워요! 나는 무슨 알일까요? 나를 멋지게 성장시켜 주세요!
                </p>
              </section>

              <button
                type="button"
                onClick={closeIntro}
                className="mt-5 w-full rounded-full bg-leaf-500 px-4 py-3 text-base font-black text-white shadow-md transition hover:bg-leaf-600 active:scale-95"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
