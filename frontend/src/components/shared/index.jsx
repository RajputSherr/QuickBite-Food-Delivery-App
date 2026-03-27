import React from 'react'

export function Spinner({ size = 36 }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
      <div style={{
        width: size, height: size,
        border: '3px solid rgba(255,255,255,0.08)',
        borderTop: '3px solid var(--brand)',
        borderRadius: '50%',
        animation: 'spin 0.75s linear infinite',
      }} />
    </div>
  )
}

export function EmptyState({ emoji = '🍽️', title, subtitle, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--mist)' }} className="anim-fade-up">
      <div style={{ fontSize: 56, marginBottom: 16 }}>{emoji}</div>
      {title    && <h3 style={{ fontSize: 22, fontWeight: 700, color: 'var(--chalk)', marginBottom: 8, fontFamily: 'Fraunces, serif' }}>{title}</h3>}
      {subtitle && <p  style={{ fontSize: 14, marginBottom: 24, maxWidth: 300, margin: '0 auto 24px' }}>{subtitle}</p>}
      {action}
    </div>
  )
}

export function FieldLabel({ children }) {
  return (
    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: 8 }}>
      {children}
    </label>
  )
}

export function ErrorMsg({ msg }) {
  if (!msg) return null
  return <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>⚠ {msg}</div>
}

export function GlobalError({ msg }) {
  if (!msg) return null
  return (
    <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--r-md)', color: 'var(--danger)', fontSize: 13, marginBottom: 16 }}>
      ⚠ {msg}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="skeleton" style={{ height: 160 }} />
      <div style={{ padding: 20 }}>
        <div className="skeleton" style={{ height: 20, marginBottom: 10, borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 14, marginBottom: 6, width: '80%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 14, width: '60%', borderRadius: 6 }} />
      </div>
    </div>
  )
}
