import { createPortal } from 'react-dom'

// design-guidelines.md §4: 삭제·구매·공개 변경에는 확인 절차를 둔다.
export default function ConfirmationModal({ open, title, description, confirmLabel = '확인', cancelLabel = '취소', onConfirm, onCancel }) {
  if (!open) return null
  // body에 직접 portal로 붙여야 한다 — FocusedLayout의 backdrop-blur 조상 안에서 렌더링되면
  // fixed의 기준이 뷰포트가 아니라 그 조상의 콘텐츠 박스 전체가 되어, 스크롤을 내려야
  // 모달이 보이는 문제가 생긴다.
  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/40 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-soft">
        <p className="text-lg font-bold text-ink-900">{title}</p>
        {description && <p className="mt-2 text-sm text-ink-700/80">{description}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-ivory-100"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-leaf-500 px-4 py-2 text-sm font-semibold text-white hover:bg-leaf-600"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
