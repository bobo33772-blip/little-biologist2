import { useEffect } from 'react'
import { primeSfxList } from '../../utils/sound'
import { whenSceneReady } from '../../utils/sceneReady'
import { getRanchHabitatSoundSrc, getGrassStageSoundSrc } from '../../utils/habitatSound'
import { SFX } from '../../utils/sfx'

// 받는 순서가 곧 우선순위다: 첫 탭에서 바로 들려야 하는 버튼·튜토리얼·알 효과음 → 목장에서
// 서식지로 들어가자마자 트는 앰비언트 → 나머지.
const FIRST_SOURCES = [SFX.buttonDefault, SFX.buttonTutorial, SFX.newEgg]

const HABITAT_SOURCES = [
  getRanchHabitatSoundSrc('soil'),
  getRanchHabitatSoundSrc('forest'),
  getRanchHabitatSoundSrc('pond'),
  getRanchHabitatSoundSrc('street-trees'),
  getRanchHabitatSoundSrc('grass'),
  getGrassStageSoundSrc(0),
  getGrassStageSoundSrc(1),
]

const OTHER_SOURCES = [
  SFX.currencyPurchase,
  SFX.missionReward,
  SFX.titleReward,
  SFX.gachaResult,
  SFX.dailyQuizComplete,
  SFX.quizCorrect,
  SFX.quizWrong,
  SFX.registerGold,
  SFX.registerSilver,
  SFX.registerBronze,
  SFX.eggToLarva,
  SFX.larvaToPupa,
  SFX.pupaToAdult,
]

const BATCH_SIZE = 3
// 아이폰처럼 사용자 터치 전에는 미리받기를 무시해 canplaythrough가 끝내 안 오는 환경이 있어,
// 한 묶음이 오래 걸리면 기다리지 않고 다음 묶음으로 넘어간다.
const BATCH_TIMEOUT_MS = 4000

function toBatches(sources) {
  const unique = [...new Set(sources.filter(Boolean))]
  const batches = []
  for (let i = 0; i < unique.length; i += BATCH_SIZE) batches.push(unique.slice(i, i + BATCH_SIZE))
  return batches
}

const PRELOAD_BATCHES = toBatches([...FIRST_SOURCES, ...HABITAT_SOURCES, ...OTHER_SOURCES])

function waitForAudio(audio) {
  // HAVE_ENOUGH_DATA(4)면 이미 다 받은 것이다.
  if (audio.readyState >= 4) return Promise.resolve()
  return new Promise((resolve) => {
    const done = () => {
      audio.removeEventListener('canplaythrough', done)
      audio.removeEventListener('error', done)
      resolve()
    }
    audio.addEventListener('canplaythrough', done)
    audio.addEventListener('error', done)
  })
}

function waitForBatch(audios) {
  let timer = null
  const timeout = new Promise((resolve) => {
    timer = window.setTimeout(resolve, BATCH_TIMEOUT_MS)
  })
  return Promise.race([Promise.all(audios.map(waitForAudio)), timeout]).finally(() => window.clearTimeout(timer))
}

export default function SoundAssetPreloader() {
  useEffect(() => {
    let cancelled = false
    let idleHandle = null
    const schedule = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 200))
    const cancel = window.cancelIdleCallback || window.clearTimeout

    // 첫 장면이 다 그려진 뒤(whenSceneReady), 그리고 한숨 돌린 유휴 시간에 시작한다. 한꺼번에
    // 다 받지 않고 3개씩 순서대로 받아, 나중에 들어온 화면 그림·청크가 회선을 쓸 틈을 남긴다.
    async function run() {
      await whenSceneReady()
      if (cancelled) return
      await new Promise((resolve) => {
        idleHandle = schedule(resolve)
      })
      idleHandle = null
      // 데이터 절약 모드에서는 바로 들려야 하는 첫 묶음만 받고, 나머지는 재생할 때 받는다.
      const batches = navigator.connection?.saveData ? PRELOAD_BATCHES.slice(0, 1) : PRELOAD_BATCHES
      for (const batch of batches) {
        if (cancelled) return
        await waitForBatch(primeSfxList(batch))
      }
    }

    run()
    return () => {
      cancelled = true
      if (idleHandle !== null) cancel(idleHandle)
    }
  }, [])

  return null
}
