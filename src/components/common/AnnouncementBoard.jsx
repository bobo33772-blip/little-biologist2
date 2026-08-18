import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, X } from 'lucide-react'

const ANNOUNCEMENT = {
  title: "🌿 [공지] '리틀 바이올로지스트' 서비스에 오신 것을 환영합니다!",
  date: '2026.08.10',
}

export default function AnnouncementBoard({ open, onClose }) {
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  if (!open) return null

  const closeBoard = () => {
    setIsDetailOpen(false)
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-ink-900/50 p-4" role="presentation" onClick={closeBoard}>
      <section role="dialog" aria-modal="true" aria-labelledby="announcement-board-title" className="flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-ivory-50 shadow-2xl sm:rounded-3xl" onClick={(event) => event.stopPropagation()}>
        <header className="flex shrink-0 items-center justify-between border-b border-ivory-200 bg-white px-5 py-4">
          {isDetailOpen ? <button type="button" onClick={() => setIsDetailOpen(false)} className="-ml-2 grid h-9 w-9 place-items-center rounded-full hover:bg-ivory-100" aria-label="공지 목록으로 돌아가기"><ChevronLeft size={21} /></button> : <span className="w-9" aria-hidden="true" />}
          <h2 id="announcement-board-title" className="text-base font-black text-ink-900">{isDetailOpen ? '공지사항' : '게시판'}</h2>
          <button type="button" onClick={closeBoard} className="grid h-9 w-9 place-items-center rounded-full hover:bg-ivory-100" aria-label="공지 닫기"><X size={20} /></button>
        </header>
        {isDetailOpen ? (
          <article className="overflow-y-auto px-5 py-6">
            <div className="mb-5 border-b border-ivory-200 pb-4"><h3 className="text-lg font-black leading-snug text-ink-900">{ANNOUNCEMENT.title}</h3><p className="mt-2 text-xs text-ink-700/55">{ANNOUNCEMENT.date}</p></div>
            <div className="space-y-5 text-sm leading-7 text-ink-800">
              <p>안녕하세요, 꼬마 탐험가 여러분!<br />우리 동네의 다양한 곤충들을 탐구하고 나만의 목장을 만드는 '리틀 바이올로지스트' 서비스가 시작되었습니다.</p>
              <div><h4 className="mb-1 font-black text-ink-900">이용 안내:</h4><p>서비스 사용법이 궁금하시다면 언제든 목장에서 탐험도우미의 도움을 받아 보세요.</p></div>
              <div><h4 className="mb-1 font-black text-ink-900">문의 접수:</h4><p>앱 이용 중 불편한 점이 있거나 개선 요청 아이디어가 있으시다면 아래 이메일로 자유롭게 전달해 주세요!</p><p className="mt-2 font-semibold">✉️ 문의 이메일: <a href="mailto:support@littlebiologist.com" className="text-leaf-700 underline underline-offset-2">support@littlebiologist.com</a></p></div>
              <p>멋진 곤충 도감을 채우며 즐거운 탐험 되시길 바랍니다. 감사합니다!</p>
            </div>
          </article>
        ) : (
          <div className="overflow-y-auto p-4"><p className="px-2 pb-3 text-xs font-semibold text-ink-700/55">새로운 소식을 확인해 보세요.</p><button type="button" onClick={() => setIsDetailOpen(true)} className="w-full rounded-2xl border border-ivory-200 bg-white p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:border-leaf-300"><span className="flex items-start justify-between gap-3"><span className="text-sm font-bold leading-6 text-ink-900">{ANNOUNCEMENT.title}</span><span className="shrink-0 rounded-full bg-leaf-100 px-2 py-1 text-[10px] font-bold text-leaf-800">공지</span></span><span className="mt-2 block text-xs text-ink-700/55">{ANNOUNCEMENT.date}</span></button></div>
        )}
      </section>
    </div>,
    document.body,
  )
}
