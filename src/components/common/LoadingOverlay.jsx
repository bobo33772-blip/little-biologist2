export default function LoadingOverlay({ message = '불러오는 중이에요...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16" role="status" aria-live="polite">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-leaf-100 border-t-leaf-500" />
      <p className="text-sm text-ink-700">{message}</p>
    </div>
  )
}
