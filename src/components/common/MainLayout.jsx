import AppHeader from './AppHeader'
import BottomNav from './BottomNav'

// 목장(허브) 화면 전용 레이아웃. 전체 메뉴가 노출되는 유일한 화면.
// 목장 화면은 스크롤 없이 한 화면(뷰포트)에 전부 들어와야 하므로
// h-screen + overflow-hidden으로 고정하고, 내부 main만 남은 공간을 채운다.
// (다른 세부 화면은 FocusedLayout을 쓰며 일반적인 스크롤 페이지로 유지된다.)
export default function MainLayout({ children, showHeader = true, showBottomNav = true }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {showHeader ? <AppHeader /> : null}
      <main className={`min-h-0 flex-1 overflow-hidden ${showHeader || showBottomNav ? 'px-4 py-4' : 'p-0'}`}>
        {children}
      </main>
      {showBottomNav ? <BottomNav /> : null}
    </div>
  )
}
