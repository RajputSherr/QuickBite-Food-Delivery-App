import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

// ── Animated 404 Page ─────────────────────────────────────────────────────────
export function NotFoundPage() {
  const emojis = ['🍕','🍔','🌮','🍜','🍗','🥗']

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', background:'var(--ink)', overflow:'hidden', position:'relative' }}>
      {/* Floating food */}
      {emojis.map((e, i) => (
        <div key={i} style={{
          position:'absolute', fontSize:clamp(24,4,48),
          left:`${5 + i*16}%`, top:`${10 + Math.sin(i)*15}%`,
          opacity:0.12, pointerEvents:'none',
          animation:`fadeUp ${2+i*0.3}s ease-in-out infinite alternate`,
          animationDelay:`${i*0.2}s`,
          fontSize: 32 + i * 4,
        }}>{e}</div>
      ))}

      <div style={{ textAlign:'center', position:'relative', zIndex:1 }}>
        {/* Big 404 */}
        <div style={{ fontFamily:'Fraunces, serif', fontSize:'clamp(80px,20vw,160px)', fontWeight:900, lineHeight:1, marginBottom:8, background:'linear-gradient(135deg,var(--brand),#fbbf24)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
          404
        </div>

        {/* Animated plate */}
        <div style={{ fontSize:80, marginBottom:24, display:'block', animation:'pulse 2s ease-in-out infinite' }}>🍽️</div>

        <h2 style={{ fontFamily:'Fraunces, serif', fontSize:28, fontWeight:900, marginBottom:12 }}>
          This page got eaten!
        </h2>
        <p style={{ color:'var(--mist)', fontSize:16, marginBottom:32, maxWidth:320, margin:'0 auto 32px' }}>
          Looks like this page was so delicious, someone ordered it. Let's get you back to the menu.
        </p>

        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <Link to="/" style={{ textDecoration:'none' }}>
            <button className="btn-primary" style={{ padding:'13px 28px', fontSize:15 }}>
              🍔 Back to Menu
            </button>
          </Link>
          <button onClick={() => window.history.back()} className="btn-ghost" style={{ padding:'13px 24px', fontSize:15 }}>
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  )
}

function clamp(min, mid, max) { return Math.min(max, Math.max(min, mid)) }

// ── Beautiful Empty States ─────────────────────────────────────────────────────
export const EMPTY_STATES = {
  cart: {
    emoji: '🛒', bg: 'rgba(249,115,22,0.05)',
    title: 'Your cart is empty',
    subtitle: 'Looks like you haven\'t added anything yet. Let\'s fix that!',
    action: 'Browse Menu 🍔',
    link: '/',
  },
  orders: {
    emoji: '📦', bg: 'rgba(59,130,246,0.05)',
    title: 'No orders yet',
    subtitle: 'Your order history will appear here. Place your first order!',
    action: 'Start Ordering 🚀',
    link: '/',
  },
  favorites: {
    emoji: '❤️', bg: 'rgba(239,68,68,0.05)',
    title: 'No favorites yet',
    subtitle: 'Tap the heart on any dish to save it here for quick ordering.',
    action: 'Explore Menu ✨',
    link: '/',
  },
  search: {
    emoji: '🔍', bg: 'rgba(139,92,246,0.05)',
    title: 'No results found',
    subtitle: 'Try different keywords or clear your filters.',
    action: null, link: null,
  },
  notifications: {
    emoji: '🔕', bg: 'rgba(156,163,175,0.05)',
    title: 'No notifications',
    subtitle: 'You\'re all caught up! Order something to get updates.',
    action: null, link: null,
  },
}

export function BeautifulEmpty({ type = 'cart', onAction }) {
  const config = EMPTY_STATES[type] || EMPTY_STATES.cart

  return (
    <div style={{ textAlign:'center', padding:'56px 24px', borderRadius:'var(--r-xl)', background:config.bg, border:'1px solid var(--border)' }} className="anim-fade-up">
      {/* Animated emoji */}
      <div style={{ fontSize:72, marginBottom:20, display:'block', animation:'scaleIn 0.5s cubic-bezier(.34,1.56,.64,1)' }}>
        {config.emoji}
      </div>

      <h3 style={{ fontFamily:'Fraunces, serif', fontSize:22, fontWeight:900, marginBottom:10, color:'var(--chalk)' }}>
        {config.title}
      </h3>
      <p style={{ color:'var(--mist)', fontSize:14, lineHeight:1.6, maxWidth:280, margin:'0 auto 24px' }}>
        {config.subtitle}
      </p>

      {config.action && (
        config.link ? (
          <Link to={config.link} style={{ textDecoration:'none' }}>
            <button className="btn-primary" style={{ padding:'11px 28px', fontSize:14 }}>
              {config.action}
            </button>
          </Link>
        ) : (
          <button className="btn-primary" onClick={onAction} style={{ padding:'11px 28px', fontSize:14 }}>
            {config.action}
          </button>
        )
      )}
    </div>
  )
}
