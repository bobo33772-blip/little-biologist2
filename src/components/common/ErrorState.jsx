// design-guidelines.md §4: 오류 메시지는 비난하지 않고 해결 행동을 알려준다.
export default function ErrorState({ title = '앗, 문제가 생겼어요', description, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-ivory-200 bg-white px-6 py-12 text-center">
      <span className="text-4xl" aria-hidden="true">🌧️</span>
      <p className="font-semibold text-ink-900">{title}</p>
      {description && <p className="max-w-xs text-sm text-ink-700/80">{description}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-leaf-500 px-5 py-2 text-sm font-semibold text-white hover:bg-leaf-600"
        >
          다시 시도하기
        </button>
      )}
    </div>
  )
}
