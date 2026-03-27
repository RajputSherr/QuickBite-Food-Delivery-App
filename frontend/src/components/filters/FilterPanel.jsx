import React, { useState } from 'react'

const SORT_OPTIONS = [
  { key: 'default',    label: '⭐ Recommended' },
  { key: 'rating',     label: '🌟 Highest Rated' },
  { key: 'price_low',  label: '💰 Price: Low to High' },
  { key: 'price_high', label: '💸 Price: High to Low' },
  { key: 'time',       label: '⚡ Fastest Delivery' },
  { key: 'popular',    label: '🔥 Most Popular' },
]

const PRICE_RANGES = [
  { key: 'all',   label: 'All Prices',  min: 0,  max: Infinity },
  { key: 'low',   label: 'Under $10',   min: 0,  max: 10 },
  { key: 'mid',   label: '$10 – $20',   min: 10, max: 20 },
  { key: 'high',  label: 'Above $20',   min: 20, max: Infinity },
]

const RATING_OPTIONS = [
  { key: 'all', label: 'All Ratings' },
  { key: '4.5', label: '⭐ 4.5+' },
  { key: '4.0', label: '⭐ 4.0+' },
  { key: '3.5', label: '⭐ 3.5+' },
]

const TIME_OPTIONS = [
  { key: 'all',  label: 'Any Time' },
  { key: '15',   label: 'Under 15 min' },
  { key: '30',   label: 'Under 30 min' },
  { key: '45',   label: 'Under 45 min' },
]

export default function FilterPanel({ filters, onChange, totalItems, vegMode }) {
  const [open, setOpen] = useState(false)

  const activeCount = [
    filters.sort !== 'default',
    filters.priceRange !== 'all',
    filters.rating !== 'all',
    filters.time !== 'all',
    filters.offers,
    filters.popular,
    filters.newOnly,
  ].filter(Boolean).length

  const reset = () => onChange({
    sort: 'default', priceRange: 'all', rating: 'all',
    time: 'all', offers: false, popular: false, newOnly: false,
  })

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        {/* Sort dropdown */}
        <select value={filters.sort} onChange={e => onChange({ ...filters, sort: e.target.value })}
          style={{ padding: '8px 14px', borderRadius: 99, background: 'var(--ink-3)', border: '1.5px solid var(--border-2)', color: 'var(--chalk)', fontFamily: 'Cabinet Grotesk, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
          {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>

        {/* Quick filters */}
        {[
          { key: 'offers',  label: '🏷️ Offers',  icon: '🏷️' },
          { key: 'popular', label: '🔥 Popular', icon: '🔥' },
          { key: 'newOnly', label: '✨ New',     icon: '✨' },
        ].map(f => (
          <button key={f.key} onClick={() => onChange({ ...filters, [f.key]: !filters[f.key] })}
            className={`tag${filters[f.key] ? ' active' : ''}`} style={{ padding: '7px 14px', fontSize: 13 }}>
            {f.label}
          </button>
        ))}

        {/* Advanced filters toggle */}
        <button onClick={() => setOpen(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 99, border: `1.5px solid ${open || activeCount > 0 ? 'var(--brand)' : 'var(--border-2)'}`, background: open || activeCount > 0 ? 'rgba(249,115,22,0.1)' : 'transparent', color: open || activeCount > 0 ? 'var(--brand)' : 'var(--mist)', fontFamily: 'Cabinet Grotesk, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
          🎛️ Filters
          {activeCount > 0 && <span style={{ background: 'var(--brand)', color: '#fff', fontSize: 10, fontWeight: 800, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{activeCount}</span>}
        </button>

        {activeCount > 0 && (
          <button onClick={reset} style={{ padding: '7px 14px', borderRadius: 99, border: '1.5px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', fontFamily: 'Cabinet Grotesk, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            ✕ Clear All
          </button>
        )}

        <span style={{ marginLeft: 'auto', color: 'var(--mist)', fontSize: 13 }}>
          {totalItems} items {vegMode && <span style={{ color: 'var(--success)', fontWeight: 700 }}>· 🟢 Veg only</span>}
        </span>
      </div>

      {/* Advanced filter panel */}
      {open && (
        <div className="anim-fade-up" style={{ background: 'var(--ink-2)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-lg)', padding: '20px 24px', marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
            {/* Price range */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--mist)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>💰 Price Range</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {PRICE_RANGES.map(p => (
                  <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: filters.priceRange === p.key ? 700 : 400, color: filters.priceRange === p.key ? 'var(--brand)' : 'var(--chalk)' }}>
                    <input type="radio" name="price" checked={filters.priceRange === p.key} onChange={() => onChange({ ...filters, priceRange: p.key })} style={{ accentColor: 'var(--brand)' }} />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--mist)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>⭐ Rating</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {RATING_OPTIONS.map(r => (
                  <label key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: filters.rating === r.key ? 700 : 400, color: filters.rating === r.key ? 'var(--brand)' : 'var(--chalk)' }}>
                    <input type="radio" name="rating" checked={filters.rating === r.key} onChange={() => onChange({ ...filters, rating: r.key })} style={{ accentColor: 'var(--brand)' }} />
                    {r.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Delivery time */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--mist)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>🕒 Delivery Time</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {TIME_OPTIONS.map(t => (
                  <label key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: filters.time === t.key ? 700 : 400, color: filters.time === t.key ? 'var(--brand)' : 'var(--chalk)' }}>
                    <input type="radio" name="time" checked={filters.time === t.key} onChange={() => onChange({ ...filters, time: t.key })} style={{ accentColor: 'var(--brand)' }} />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Apply filters to items ─────────────────────────────────────────────────────
export function applyFilters(items, filters, vegMode, search) {
  let result = [...items]

  // Search
  if (search.trim()) {
    const s = search.toLowerCase()
    result = result.filter(i => i.name.toLowerCase().includes(s) || i.description?.toLowerCase().includes(s) || i.category?.toLowerCase().includes(s))
  }

  // Veg mode - filter non-veg categories
  if (vegMode) {
    const vegCategories = ['Healthy', 'Desserts', 'Drinks', 'Italian', 'Pizza']
    result = result.filter(i => vegCategories.includes(i.category) || i.isVeg)
  }

  // Price range
  const RANGES = { low: [0,10], mid: [10,20], high: [20, Infinity] }
  if (filters.priceRange !== 'all') {
    const [min, max] = RANGES[filters.priceRange]
    result = result.filter(i => i.price >= min && i.price < max)
  }

  // Rating
  if (filters.rating !== 'all') {
    result = result.filter(i => i.rating >= parseFloat(filters.rating))
  }

  // Delivery time
  if (filters.time !== 'all') {
    const maxTime = parseInt(filters.time)
    result = result.filter(i => {
      const t = parseInt(i.deliveryTime?.split('-')[0] || '99')
      return t <= maxTime
    })
  }

  // Popular
  if (filters.popular) result = result.filter(i => i.isPopular)

  // Sort
  switch (filters.sort) {
    case 'rating':     result.sort((a,b) => b.rating - a.rating); break
    case 'price_low':  result.sort((a,b) => a.price - b.price); break
    case 'price_high': result.sort((a,b) => b.price - a.price); break
    case 'time':       result.sort((a,b) => parseInt(a.deliveryTime) - parseInt(b.deliveryTime)); break
    case 'popular':    result.sort((a,b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0)); break
    default: break
  }

  return result
}
