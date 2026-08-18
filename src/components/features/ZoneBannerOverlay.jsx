import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo } from 'react'

// 대객체(서식지)에 들어갈 때 재생되는 진입 효과 배너. 서식지 이름에 따라 테마(꽃밭/나무/풀밭/
// 연못/흙)를 골라 그에 맞는 파티클·색을 띄우고, 2.1초 후 자동으로 사라진다.
const THEMES = {
  meadow: {
    particles: ['🍃', '🌿', '🌱', '✨'],
    glow: 'rgba(132, 204, 22, 0.34)',
    ring: 'rgba(217, 249, 157, 0.54)',
    text: 'from-lime-100 via-white to-emerald-100',
    drift: 'leaf',
  },
  flower: {
    particles: ['🌸', '✨', '🌼', '💮'],
    glow: 'rgba(255, 154, 196, 0.38)',
    ring: 'rgba(255, 231, 145, 0.56)',
    text: 'from-pink-100 via-white to-yellow-100',
    drift: 'flower',
  },
  tree: {
    particles: ['🍃', '🌿', '🍂', '✨'],
    glow: 'rgba(34, 197, 94, 0.34)',
    ring: 'rgba(187, 247, 208, 0.52)',
    text: 'from-emerald-100 via-white to-lime-100',
    drift: 'leaf',
  },
  pond: {
    particles: ['💧', '🫧', '✨', '🌊'],
    glow: 'rgba(72, 211, 255, 0.32)',
    ring: 'rgba(186, 244, 255, 0.5)',
    text: 'from-cyan-100 via-white to-sky-100',
    drift: 'water',
  },
  earth: {
    particles: ['🌱', '🍂', '✨', '🪨'],
    glow: 'rgba(180, 122, 61, 0.32)',
    ring: 'rgba(255, 210, 145, 0.4)',
    text: 'from-amber-100 via-white to-lime-100',
    drift: 'earth',
  },
  default: {
    particles: ['✨', '🌟', '💫', '🍃'],
    glow: 'rgba(255, 255, 255, 0.28)',
    ring: 'rgba(255, 255, 255, 0.44)',
    text: 'from-white via-yellow-50 to-cyan-100',
    drift: 'sparkle',
  },
}

function getZoneTheme(zoneName) {
  if (zoneName.includes('꽃밭') || zoneName.includes('꽃')) return THEMES.flower
  if (zoneName.includes('나무') || zoneName.includes('숲') || zoneName.includes('가로수')) return THEMES.tree
  if (zoneName.includes('풀밭') || zoneName.includes('풀')) return THEMES.meadow
  if (zoneName.includes('연못') || zoneName.includes('습지')) return THEMES.pond
  if (zoneName.includes('흙') || zoneName.includes('땅')) return THEMES.earth
  return THEMES.default
}

function getParticleMotion(theme, distance) {
  if (theme.drift === 'flower') {
    return {
      x: [0, distance * 0.16, -distance * 0.12, distance * 0.26],
      y: [22, -18, -48, -76],
      rotate: [-20, 18, -12, 34],
      scale: [0.45, 1.08, 0.92, 0.55],
    }
  }

  if (theme.drift === 'water') {
    return {
      x: [0, distance * 0.08, distance * 0.14],
      y: [30, -10, -86],
      rotate: [0, 8, -6],
      scale: [0.45, 1, 0.42],
    }
  }

  if (theme.drift === 'earth') {
    return {
      x: [0, distance * 0.28, distance * 0.42],
      y: [14, -10, -42],
      rotate: [-12, 10, 28],
      scale: [0.55, 1, 0.62],
    }
  }

  return {
    x: [0, distance * 0.42, distance],
    y: [18, -16, -58],
    rotate: [-18, 16, 44],
    scale: [0.5, 1, 0.65],
  }
}

export default function ZoneBannerOverlay({ zoneName, isOpen, onClose }) {
  const theme = useMemo(() => getZoneTheme(zoneName), [zoneName])

  const particles = useMemo(
    () =>
      Array.from({ length: 24 }, (_, index) => ({
        id: index,
        icon: theme.particles[index % theme.particles.length],
        left: 10 + ((index * 19) % 80),
        top: 21 + ((index * 31) % 50),
        delay: (index % 9) * 0.075,
        size: 18 + (index % 4) * 8,
        distance: 86 + (index % 5) * 22,
      })),
    [theme.particles],
  )

  useEffect(() => {
    if (!isOpen) return undefined

    const closeTimer = window.setTimeout(onClose, 2100)
    return () => window.clearTimeout(closeTimer)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{ background: 'rgba(0, 0, 0, 0.28)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35 } }}
          aria-hidden="true"
        >
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 'min(30rem, 86vw)',
              height: 'min(30rem, 86vw)',
              background: `radial-gradient(circle, ${theme.glow} 0%, transparent 68%)`,
            }}
            initial={{ scale: 0.45, opacity: 0 }}
            animate={{ scale: [0.45, 1.05, 0.94], opacity: [0, 1, 0.62] }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 1.75, ease: 'easeOut' }}
          />

          <motion.div
            className="absolute rounded-full border-y border-white/25"
            style={{
              width: 'min(42rem, 82vw)',
              height: '10rem',
              boxShadow: `0 0 42px ${theme.ring}`,
            }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: [0, 1.08, 1], opacity: [0, 1, 0.72] }}
            exit={{ y: -28, opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />

          {particles.map((particle) => {
            const motionPath = getParticleMotion(theme, particle.distance)

            return (
              <motion.span
                key={particle.id}
                className="absolute select-none"
                style={{
                  left: `${particle.left}%`,
                  top: `${particle.top}%`,
                  fontSize: particle.size,
                  filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.28))',
                }}
                initial={{ x: -28, y: 36, opacity: 0, rotate: -18, scale: 0.5 }}
                animate={{
                  ...motionPath,
                  opacity: [0, 1, 0],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 1.75,
                  delay: particle.delay,
                  ease: 'easeOut',
                }}
              >
                {particle.icon}
              </motion.span>
            )
          })}

          <motion.div
            className="relative flex min-w-[13rem] flex-col items-center justify-center text-center"
            style={{
              left: 0,
              right: 0,
              marginInline: 'auto',
              transformOrigin: '50% 50%',
            }}
            initial={{ y: 18, scale: 0.62, opacity: 0 }}
            animate={{
              y: [18, 0, 0, -34],
              scale: [0.62, 1.14, 1, 0.96],
              opacity: [0, 1, 1, 0],
            }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ duration: 2, times: [0, 0.24, 0.72, 1], ease: 'easeOut' }}
          >
            <p className="text-xs font-black uppercase tracking-[0.42em] text-white/70 drop-shadow-md">
              서식지
            </p>
            <h2
              className={`mt-2 block w-full bg-gradient-to-b ${theme.text} bg-clip-text text-center text-5xl font-black text-transparent`}
              style={{
                fontFamily: '"Jua", "Gamja Flower", "Noto Sans KR", ui-rounded, system-ui, sans-serif',
                fontSize: 'clamp(3.25rem, 12vw, 6.5rem)',
                lineHeight: 1,
                letterSpacing: 0,
                paddingInline: 0,
                textAlign: 'center',
                color: '#fffef0',
                textShadow:
                  '0 6px 0 rgba(31,41,55,0.55), 0 14px 28px rgba(0,0,0,0.45), 0 0 18px rgba(255,255,255,0.72)',
                WebkitTextStroke: '1px rgba(255,255,255,0.42)',
              }}
            >
              {zoneName}
            </h2>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
