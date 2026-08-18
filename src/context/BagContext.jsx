import { createContext, useContext, useEffect, useState } from 'react'
import { mockBagItems } from '../data/mockData'
import { reportMissionEvent } from '../utils/missionEvents'
import { useAuth } from '../router/AuthContext'
import { fetchUserState, saveUserState } from '../api/userState'

// 가방 아이템 수량/배치는 계정별 진행도라 로그인한 uid 기준으로 서버(user_state)에 저장한다.
const BagContext = createContext(null)

const BAG_ITEMS_KEY = 'bagItems'
const PLACEMENTS_KEY = 'placements'
const BAG_CAPACITY_KEY = 'bagCapacity'
const DEFAULT_BAG_CAPACITY = 30
const BAG_CAPACITY_INCREMENT = 10

export function BagProvider({ children }) {
  const { user } = useAuth()
  const [bagItems, setBagItems] = useState(mockBagItems)
  // 목장에 배치된 인테리어 아이템 하나하나의 위치/크기. 대객체(HABITATS) 편집과 같은 방식으로
  // 목장 화면에서 드래그 이동·확대축소할 수 있다 (Ranch.jsx의 PlacedItemsLayer가 렌더링/편집한다).
  const [placements, setPlacements] = useState([])
  // 인테리어 배치 칸 한도. 기본 30칸이며 상점의 "가방 확장권"을 사면 10칸씩 늘어난다
  // (Bag.jsx/Ranch.jsx 둘 다 이 값을 기준으로 인테리어 슬롯 수를 계산한다).
  const [bagCapacity, setBagCapacity] = useState(DEFAULT_BAG_CAPACITY)

  useEffect(() => {
    if (!user?.uid) return
    let cancelled = false
    fetchUserState(user.uid).then((state) => {
      if (cancelled) return
      setBagItems(Array.isArray(state[BAG_ITEMS_KEY]) ? state[BAG_ITEMS_KEY] : mockBagItems)
      setPlacements(Array.isArray(state[PLACEMENTS_KEY]) ? state[PLACEMENTS_KEY] : [])
      setBagCapacity(typeof state[BAG_CAPACITY_KEY] === 'number' ? state[BAG_CAPACITY_KEY] : DEFAULT_BAG_CAPACITY)
    })
    return () => {
      cancelled = true
    }
  }, [user?.uid])

  const expandBag = () => {
    setBagCapacity((current) => {
      const next = current + BAG_CAPACITY_INCREMENT
      if (user?.uid) saveUserState(user.uid, BAG_CAPACITY_KEY, next)
      return next
    })
  }

  const addItem = ({ id, name, category, image }) => {
    setBagItems((current) => {
      const existing = current.find((i) => i.id === id)
      const next = existing
        ? current.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i))
        : [...current, { id, name, category, image, qty: 1, placed: 0 }]
      if (user?.uid) saveUserState(user.uid, BAG_ITEMS_KEY, next)
      return next
    })
  }

  // 배치 가능하면 bagItems의 placed 수를 늘리고, 목장 화면에 새 배치 인스턴스를 만든다.
  // 새로 만든 인스턴스 id를 반환해서 호출한 쪽(Bag.jsx)이 그 아이템을 바로 편집 모드로 열 수 있게 한다.
  const placeItem = (id) => {
    const item = bagItems.find((i) => i.id === id)
    if (!item || item.placed >= item.qty) return null

    const instanceId = `${id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

    setBagItems((current) => {
      const next = current.map((i) => (i.id === id ? { ...i, placed: i.placed + 1 } : i))
      if (user?.uid) saveUserState(user.uid, BAG_ITEMS_KEY, next)
      return next
    })
    reportMissionEvent({ type: 'interior_place' })
    setPlacements((current) => {
      const next = [
        ...current,
        { id: instanceId, itemId: id, name: item.name, image: item.image, x: 50, y: 60, scale: 1 },
      ]
      if (user?.uid) saveUserState(user.uid, PLACEMENTS_KEY, next)
      return next
    })

    return instanceId
  }

  // 목장에 배치된 것 중 하나(가장 최근에 배치한 것)를 다시 가방으로 회수한다.
  const retrieveItem = (id) => {
    setBagItems((current) => {
      const next = current.map((i) => (i.id === id && i.placed > 0 ? { ...i, placed: i.placed - 1 } : i))
      if (user?.uid) saveUserState(user.uid, BAG_ITEMS_KEY, next)
      return next
    })
    setPlacements((current) => {
      let removeIndex = -1
      for (let i = current.length - 1; i >= 0; i -= 1) {
        if (current[i].itemId === id) {
          removeIndex = i
          break
        }
      }
      if (removeIndex === -1) return current
      const next = current.filter((_, i) => i !== removeIndex)
      if (user?.uid) saveUserState(user.uid, PLACEMENTS_KEY, next)
      return next
    })
  }

  // retrieveItem은 itemId 기준으로 "가장 최근에 배치한 것" 하나를 회수한다(가방 화면처럼 특정
  // 인스턴스를 고르지 않은 경우용). 목장에서 특정 배치 인스턴스를 선택해 회수할 때는 엉뚱한 걸
  // 치우면 안 되니, 그 instanceId를 정확히 지정해서 회수하는 이 함수를 쓴다.
  const retrieveInstance = (instanceId) => {
    const placement = placements.find((p) => p.id === instanceId)
    if (!placement) return

    setBagItems((current) => {
      const next = current.map((i) => (i.id === placement.itemId && i.placed > 0 ? { ...i, placed: i.placed - 1 } : i))
      if (user?.uid) saveUserState(user.uid, BAG_ITEMS_KEY, next)
      return next
    })
    setPlacements((current) => {
      const next = current.filter((p) => p.id !== instanceId)
      if (user?.uid) saveUserState(user.uid, PLACEMENTS_KEY, next)
      return next
    })
  }

  const updatePlacementPosition = (instanceId, position) => {
    setPlacements((current) => {
      const next = current.map((p) => (p.id === instanceId ? { ...p, ...position } : p))
      if (user?.uid) saveUserState(user.uid, PLACEMENTS_KEY, next)
      return next
    })
  }

  const updatePlacementScale = (instanceId, scale) => {
    setPlacements((current) => {
      const next = current.map((p) => (p.id === instanceId ? { ...p, scale } : p))
      if (user?.uid) saveUserState(user.uid, PLACEMENTS_KEY, next)
      return next
    })
  }

  return (
    <BagContext.Provider
      value={{
        bagItems,
        bagCapacity,
        expandBag,
        addItem,
        placeItem,
        retrieveItem,
        retrieveInstance,
        placements,
        updatePlacementPosition,
        updatePlacementScale,
      }}
    >
      {children}
    </BagContext.Provider>
  )
}

export function useBag() {
  const ctx = useContext(BagContext)
  if (!ctx) throw new Error('useBag must be used within BagProvider')
  return ctx
}
