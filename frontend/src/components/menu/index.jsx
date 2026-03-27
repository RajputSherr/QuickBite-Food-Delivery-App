import React, { useState } from 'react'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { SkeletonCard, EmptyState } from '../shared'
import { fmt } from '../../utils/helpers'

// ── VEG CATEGORIES ────────────────────────────────────────────────────────────
const VEG_CATS = ['Healthy', 'Desserts', 'Drinks']
const isVegItem = (item) => VEG_CATS.includes(item.category) || item.isVeg

// ── MenuCard ──────────────────────────────────────────────────────────────────
export function MenuCard({ item, onAuthNeeded }) {
  const { addItem }                    = useCart()
  const { user }                       = useAuth()
  const { isFavorite, toggleFavorite } = useApp()
  const [adding, setAdding]   = useState(false)
  const [added, setAdded]     = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const fav = isFavorite(item._id)

  const handleAdd = async (note = '') => {
    if (!user) { onAuthNeeded(); return }
    setAdding(true)
    const ok = await addItem({ ...item, note })
    setAdding(false)
    if (ok) { setAdded(true); setTimeout(() => setAdded(false), 1500) }
  }

  const veg = isVegItem(item)

  return (
    <>
      <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'default' }}>
        {/* Image */}
        <div style={{ height: 170, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 68, position: 'relative', flexShrink: 0, background: 'linear-gradient(135deg, var(--ink-3), var(--ink-4))', cursor: 'pointer' }}
          onClick={() => setShowDetail(true)}>
          {item.emoji}
          {/* Veg/NonVeg dot */}
          <div style={{ position: 'absolute', top: 12, left: 12, width: 18, height: 18, border: `2px solid ${veg ? 'var(--success)' : 'var(--danger)'}`, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ink-2)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: veg ? 'var(--success)' : 'var(--danger)' }} />
          </div>
          {item.isPopular && <span className="badge badge-brand" style={{ position: 'absolute', top: 12, right: 44, fontSize: 10 }}>🔥 Popular</span>}
          {/* Favorite button */}
          <button onClick={e => { e.stopPropagation(); if (!user) { onAuthNeeded(); return; } toggleFavorite(item._id) }} style={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, transition: 'transform 0.2s', transform: fav ? 'scale(1.1)' : 'scale(1)' }}>
            {fav ? '❤️' : '🤍'}
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--mist)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>{item.category}</p>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 17, fontWeight: 900, marginBottom: 6, lineHeight: 1.2, cursor: 'pointer' }} onClick={() => setShowDetail(true)}>{item.name}</h3>
            <p style={{ color: 'var(--mist)', fontSize: 12, lineHeight: 1.55, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--brand)', fontFamily: 'Fraunces, serif' }}>{fmt(item.price)}</div>
              <div style={{ fontSize: 11, color: 'var(--mist)', marginTop: 2 }}>⭐ {item.rating} · 🕒 {item.deliveryTime} min</div>
            </div>
            <button onClick={() => handleAdd()} disabled={adding} style={{ padding: '8px 18px', borderRadius: 99, border: 'none', background: added ? 'var(--success)' : adding ? 'var(--ink-4)' : 'var(--brand)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: adding ? 'default' : 'pointer', fontFamily: 'Cabinet Grotesk, sans-serif', transition: 'background 0.25s', minWidth: 76 }}>
              {added ? '✓ Added' : adding ? '...' : '+ Add'}
            </button>
          </div>
        </div>
      </div>

      {/* Item Detail Modal */}
      {showDetail && <ItemDetailModal item={item} onClose={() => setShowDetail(false)} onAdd={handleAdd} user={user} onAuthNeeded={onAuthNeeded} />}
    </>
  )
}

// ── Item Detail Modal ─────────────────────────────────────────────────────────
function ItemDetailModal({ item, onClose, onAdd, user, onAuthNeeded }) {
  const [note, setNote] = useState('')
  const [qty, setQty]   = useState(1)
  const { isFavorite, toggleFavorite } = useApp()
  const fav = isFavorite(item._id)
  const veg = isVegItem(item)

  const handleAdd = async () => {
    for (let i = 0; i < qty; i++) await onAdd(note)
    onClose()
  }

  return (
    <div className="overlay anim-fade-in" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="anim-scale-in" style={{ background: 'var(--ink-2)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-xl)', width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
        {/* Emoji header */}
        <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, background: 'linear-gradient(135deg, var(--ink-3), var(--ink-4))', position: 'relative' }}>
          {item.emoji}
          <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: '#fff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          <button onClick={() => { if (!user) { onAuthNeeded(); return; } toggleFavorite(item._id) }} style={{ position: 'absolute', top: 14, right: 52, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {fav ? '❤️' : '🤍'}
          </button>
          <div style={{ position: 'absolute', bottom: 14, left: 14, display: 'flex', gap: 6 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.6)', fontSize: 11, fontWeight: 700, color: veg ? 'var(--success)' : 'var(--danger)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: veg ? 'var(--success)' : 'var(--danger)', display: 'inline-block' }} />
              {veg ? 'VEG' : 'NON-VEG'}
            </span>
            {item.isPopular && <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(249,115,22,0.8)', fontSize: 11, fontWeight: 700, color: '#fff' }}>🔥 Popular</span>}
          </div>
        </div>

        <div style={{ padding: '20px 24px 24px' }}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 24, fontWeight: 900, marginBottom: 6 }}>{item.name}</h2>
          <p style={{ color: 'var(--mist)', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{item.description}</p>

          {/* Meta info */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 20, padding: '12px 16px', background: 'var(--ink-3)', borderRadius: 'var(--r-md)' }}>
            {[['⭐ Rating', item.rating], ['🕒 Delivery', `${item.deliveryTime} min`], ['📦 Category', item.category]].map(([l, v]) => (
              <div key={l} style={{ textAlign: 'center', flex: 1 }}>
                <p style={{ fontSize: 11, color: 'var(--mist)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{l}</p>
                <p style={{ fontWeight: 700, fontSize: 14 }}>{v}</p>
              </div>
            ))}
          </div>

          {/* Special instructions */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--mist)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>📝 Special Instructions (optional)</label>
            <textarea className="input" rows={2} placeholder="e.g. Extra spicy, no onions, less oil..." value={note} onChange={e => setNote(e.target.value)} style={{ resize: 'none', fontSize: 14 }} />
          </div>

          {/* Qty + Add */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--ink-3)', borderRadius: 99, padding: '6px 14px', border: '1px solid var(--border-2)' }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ background: 'none', border: 'none', color: 'var(--chalk)', cursor: 'pointer', fontSize: 18, fontWeight: 700, width: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <span style={{ fontWeight: 800, minWidth: 20, textAlign: 'center', fontSize: 16 }}>{qty}</span>
              <button onClick={() => setQty(q => q + 1)} style={{ background: 'none', border: 'none', color: 'var(--chalk)', cursor: 'pointer', fontSize: 18, fontWeight: 700, width: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
            <button className="btn-primary" onClick={handleAdd} style={{ flex: 1, padding: '13px', fontSize: 15 }}>
              Add {qty > 1 ? `${qty} items` : 'to Cart'} · {fmt(item.price * qty)}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MenuGrid ──────────────────────────────────────────────────────────────────
export function MenuGrid({ items, loading, error, onAuthNeeded }) {
  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 20 }}>
      {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  )
  if (error)         return <EmptyState emoji="😕" title="Oops!" subtitle={error} />
  if (!items.length) return <EmptyState emoji="🔍" title="No results found" subtitle="Try adjusting your filters" />
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 20 }}>
      {items.map((item, i) => (
        <div key={item._id} className="anim-fade-up" style={{ animationDelay: `${Math.min(i * 0.04, 0.4)}s` }}>
          <MenuCard item={item} onAuthNeeded={onAuthNeeded} />
        </div>
      ))}
    </div>
  )
}

// ── CategoryFilter ────────────────────────────────────────────────────────────
export function CategoryFilter({ categories, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
      {categories.map(cat => (
        <button key={cat} className={`tag${active === cat ? ' active' : ''}`} onClick={() => onChange(cat)}>{cat}</button>
      ))}
    </div>
  )
}
