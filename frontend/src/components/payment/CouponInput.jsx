import React, { useState } from 'react'
import toast from 'react-hot-toast'

const COUPONS = {
  'WELCOME10':  { discount: 10, type: 'percent',  desc: '10% off your order',    min: 0  },
  'SAVE50':     { discount: 50, type: 'flat',     desc: '$5 off orders above $50', min: 50 },
  'FREESHIP':   { discount: 0,  type: 'delivery', desc: 'Free delivery',          min: 20 },
  'QUICKBITE':  { discount: 15, type: 'percent',  desc: '15% off entire order',   min: 30 },
  'NEWUSER':    { discount: 20, type: 'percent',  desc: '20% off first order',    min: 0  },
  'BIRTHDAY':   { discount: 25, type: 'percent',  desc: '25% birthday special',   min: 0  },
}

export function useCoupon() {
  const [coupon, setCoupon] = useState(null)

  const apply = (code, subtotal) => {
    const c = COUPONS[code.toUpperCase()]
    if (!c) { toast.error('❌ Invalid coupon code'); return null }
    if (subtotal < c.min) { toast.error(`Minimum order of $${c.min} required`); return null }
    toast.success(`🎉 Coupon applied: ${c.desc}`)
    const couponData = { code: code.toUpperCase(), ...c }
    setCoupon(couponData)
    return couponData
  }

  const remove = () => { setCoupon(null); toast('Coupon removed') }

  const getDiscount = (subtotal) => {
    if (!coupon) return 0
    if (coupon.type === 'percent')  return +(subtotal * coupon.discount / 100).toFixed(2)
    if (coupon.type === 'flat')     return coupon.discount
    if (coupon.type === 'delivery') return 0 // handled separately
    return 0
  }

  return { coupon, apply, remove, getDiscount }
}

export default function CouponInput({ subtotal, coupon, onApply, onRemove }) {
  const [code, setCode] = useState('')

  const handleApply = () => {
    if (!code.trim()) { toast.error('Enter a coupon code'); return }
    const result = onApply(code.trim(), subtotal)
    if (result) setCode('')
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--mist)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>🏷️ Promo Code</p>

      {coupon ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 'var(--r-md)' }}>
          <span style={{ fontSize: 18 }}>✅</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--success)' }}>{coupon.code}</p>
            <p style={{ color: 'var(--mist)', fontSize: 12 }}>{coupon.desc}</p>
          </div>
          <button onClick={onRemove} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 18, padding: 4 }}>✕</button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 0 }}>
          <input className="input" style={{ borderRadius: 'var(--r-md) 0 0 var(--r-md)', borderRight: 'none', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}
            placeholder="Enter coupon code" value={code} onChange={e => setCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleApply()} />
          <button className="btn-primary" onClick={handleApply} style={{ borderRadius: '0 var(--r-md) var(--r-md) 0', padding: '0 20px', fontSize: 14, flexShrink: 0 }}>Apply</button>
        </div>
      )}

      {/* Available coupons hint */}
      <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {['WELCOME10', 'QUICKBITE', 'NEWUSER'].map(c => (
          <button key={c} onClick={() => { setCode(c) }} style={{ padding: '3px 8px', borderRadius: 6, background: 'var(--ink-3)', border: '1px solid var(--border-2)', color: 'var(--mist)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Cabinet Grotesk, sans-serif', letterSpacing: '0.05em' }}>
            {c}
          </button>
        ))}
        <span style={{ fontSize: 11, color: 'var(--mist)', alignSelf: 'center' }}>← Try these codes</span>
      </div>
    </div>
  )
}
