import { useEffect } from 'react'
import { playSfx, primeSfx } from '../../utils/sound'
import { SFX } from '../../utils/sfx'

export default function ButtonSoundController() {
  useEffect(() => {
    primeSfx(SFX.buttonDefault)

    const handleClick = (event) => {
      const target = event.target
      if (!(target instanceof Element)) return
      // 버튼뿐 아니라 하단 네비게이션(탐험/도감/미션/친구/상점 등)처럼 NavLink(<a> 태그)로
      // 구현된 클릭 대상도 소리가 나야 해서 함께 감지한다.
      const trigger = target.closest('button, a[href]')
      if (!trigger || trigger.disabled) return
      // 자기만의 전용 효과음을 직접 재생하는 버튼(튜토리얼 버튼, 재화 구매, 미션/칭호 보상
      // 수령, 뽑기 등)은 data-click-sfx="none"으로 표시해서 이 기본 효과음과 안 겹치게 한다.
      if (trigger.closest('[data-click-sfx="none"]')) return
      playSfx(SFX.buttonDefault, { volume: 0.9 })
    }

    document.addEventListener('click', handleClick, true)
    return () => {
      document.removeEventListener('click', handleClick, true)
    }
  }, [])

  return null
}
