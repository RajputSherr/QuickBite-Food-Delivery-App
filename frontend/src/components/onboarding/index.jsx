import React, { useState, useEffect } from 'react'

// ── Splash Screen ─────────────────────────────────────────────────────────────
export function SplashScreen({ onDone }) {
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState(0) // 0=loading, 1=done

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(interval); setPhase(1); setTimeout(onDone, 400); return 100 }
        return p + 2
      })
    }, 30)
    return () => clearInterval(interval)
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--ink)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, transition: 'opacity 0.4s',
      opacity: phase === 1 ? 0 : 1,
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 22, background: 'var(--brand)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40, fontWeight: 900, color: '#fff',
          margin: '0 auto 20px',
          boxShadow: '0 0 40px rgba(249,115,22,0.5)',
          animation: 'pulse 2s ease-in-out infinite',
        }}>🔥</div>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 36, fontWeight: 900, marginBottom: 8 }}>QuickBite</h1>
        <p style={{ color: 'var(--mist)', fontSize: 15 }}>Premium Food Delivery</p>
      </div>

      {/* Progress bar */}
      <div style={{ width: 200, height: 4, background: 'var(--ink-3)', borderRadius: 99, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--brand), #fbbf24)', borderRadius: 99, transition: 'width 0.03s linear' }} />
      </div>
      <p style={{ color: 'var(--mist)', fontSize: 13 }}>Loading{progress < 33 ? '.' : progress < 66 ? '..' : '...'}</p>

      {/* Floating food emojis */}
      {['🍔','🍕','🍜','🌮','🍗','🥗','🍰','🥤'].map((emoji, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${10 + (i * 12)}%`,
          top: `${15 + Math.sin(i * 0.8) * 10}%`,
          fontSize: 28,
          opacity: 0.15,
          animation: `fadeUp ${1.5 + i * 0.2}s ease-in-out infinite alternate`,
          animationDelay: `${i * 0.15}s`,
        }}>{emoji}</div>
      ))}
    </div>
  )
}

// ── Onboarding Screens ────────────────────────────────────────────────────────
const SLIDES = [
  {
    emoji: '🍔',
    title: 'Premium Food\nDelivered Fast',
    desc: 'Order from hundreds of top-rated restaurants. Fresh food, hot delivery.',
    color: '#f97316',
    bg: 'radial-gradient(ellipse at center, rgba(249,115,22,0.2) 0%, transparent 70%)',
  },
  {
    emoji: '🛵',
    title: 'Real-Time\nOrder Tracking',
    desc: 'Track your delivery live. Know exactly when your food arrives.',
    color: '#3b82f6',
    bg: 'radial-gradient(ellipse at center, rgba(59,130,246,0.2) 0%, transparent 70%)',
  },
  {
    emoji: '⭐',
    title: 'Earn Loyalty\nPoints',
    desc: 'Every order earns you points. Redeem for discounts and free delivery.',
    color: '#fbbf24',
    bg: 'radial-gradient(ellipse at center, rgba(251,191,36,0.2) 0%, transparent 70%)',
  },
  {
    emoji: '🏷️',
    title: 'Exclusive\nOffers & Deals',
    desc: 'Daily offers, promo codes, and seasonal discounts just for you.',
    color: '#22c55e',
    bg: 'radial-gradient(ellipse at center, rgba(34,197,94,0.2) 0%, transparent 70%)',
  },
]

export function OnboardingScreens({ onDone }) {
  const [slide, setSlide] = useState(0)
  const current = SLIDES[slide]
  const isLast  = slide === SLIDES.length - 1

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--ink)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
      padding: '60px 32px 48px', zIndex: 9998, overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{ position: 'absolute', inset: 0, background: current.bg, transition: 'background 0.5s', pointerEvents: 'none' }} />

      {/* Skip */}
      <button onClick={onDone} style={{ alignSelf: 'flex-end', background: 'none', border: 'none', color: 'var(--mist)', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'Cabinet Grotesk, sans-serif', position: 'relative', zIndex: 1 }}>
        Skip →
      </button>

      {/* Content */}
      <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
        <div key={slide} style={{ animation: 'scaleIn 0.4s cubic-bezier(.34,1.56,.64,1)' }}>
          <div style={{
            width: 140, height: 140, borderRadius: '50%',
            background: `rgba(${current.color === '#f97316' ? '249,115,22' : current.color === '#3b82f6' ? '59,130,246' : current.color === '#fbbf24' ? '251,191,36' : '34,197,94'},0.15)`,
            border: `3px solid ${current.color}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 72, margin: '0 auto 32px',
            boxShadow: `0 0 60px ${current.color}30`,
          }}>
            {current.emoji}
          </div>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 900, marginBottom: 16, whiteSpace: 'pre-line', lineHeight: 1.2, color: 'var(--chalk)' }}>
            {current.title}
          </h2>
          <p style={{ color: 'var(--mist)', fontSize: 16, maxWidth: 320, lineHeight: 1.6, margin: '0 auto' }}>
            {current.desc}
          </p>
        </div>
      </div>

      {/* Bottom */}
      <div style={{ width: '100%', maxWidth: 380, position: 'relative', zIndex: 1 }}>
        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
          {SLIDES.map((_, i) => (
            <div key={i} onClick={() => setSlide(i)} style={{ height: 8, borderRadius: 99, background: i === slide ? current.color : 'var(--ink-4)', width: i === slide ? 28 : 8, transition: 'all 0.3s', cursor: 'pointer' }} />
          ))}
        </div>

        {/* Button */}
        <button onClick={() => isLast ? onDone() : setSlide(s => s + 1)} style={{
          width: '100%', padding: '16px', borderRadius: 'var(--r-xl)',
          border: 'none', background: current.color, color: '#fff',
          fontFamily: 'Cabinet Grotesk, sans-serif', fontSize: 16, fontWeight: 700,
          cursor: 'pointer', transition: 'all 0.2s',
          boxShadow: `0 8px 24px ${current.color}40`,
        }}>
          {isLast ? '🚀 Start Ordering!' : 'Next →'}
        </button>
      </div>
    </div>
  )
}
