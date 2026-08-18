export default function AuthToast({ type = 'error', message }) {
  if (!message) return null

  const isInfo = type === 'info'

  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-50 flex justify-center">
      <div
        className={`pointer-events-auto min-w-[18rem] max-w-md rounded-[1.35rem] border px-6 py-4 text-center font-['Jua'] text-base shadow-[0_12px_28px_rgba(35,60,20,0.24)] backdrop-blur-md ${
          isInfo
            ? 'border-lime-300/80 bg-lime-100/90 text-emerald-900'
            : 'border-emerald-300/80 bg-white/90 text-emerald-950'
        }`}
      >
        <span className="mr-1" aria-hidden="true">{isInfo ? '🌱' : '🍃'}</span>
        {message}
      </div>
    </div>
  )
}
