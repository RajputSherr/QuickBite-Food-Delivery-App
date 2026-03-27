import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { EmptyState } from '../shared'
import { fmt } from '../../utils/helpers'

export default function CartDrawer({ open, onClose, onAuthNeeded }) {
  const { items, updateItem, removeItem, subtotal, tax, total, itemCount } = useCart()
  const { user }   = useAuth()
  const navigate   = useNavigate()

  const handleCheckout = () => {
    if (!user) { onClose(); onAuthNeeded(); return }
    onClose(); navigate('/checkout')
  }

  if (!open) return null

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 149 }} />
      <div className="anim-slide-right" style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(440px, 100vw)', background: 'var(--ink-2)', borderLeft: '1px solid var(--border)', zIndex: 150, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 48px rgba(0,0,0,0.5)' }}>
        {/* Header */}
        <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 2 }}>Your Order</h2>
            <p style={{ color: 'var(--mist)', fontSize: 13 }}>{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--ink-3)', border: 'none', borderRadius: 99, width: 36, height: 36, color: 'var(--mist)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {items.length === 0 ? (
            <EmptyState emoji="🛒" title="Cart is empty" subtitle="Add some delicious items!" />
          ) : items.map(item => (
            <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', marginBottom: 10, background: 'var(--ink-3)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 28, flexShrink: 0 }}>{item.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                <p style={{ color: 'var(--brand)', fontWeight: 700 }}>{fmt(item.price * item.quantity)}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <QtyBtn onClick={() => item.quantity === 1 ? removeItem(item._id) : updateItem(item._id, item.quantity - 1)}>−</QtyBtn>
                <span style={{ fontWeight: 800, minWidth: 18, textAlign: 'center' }}>{item.quantity}</span>
                <QtyBtn onClick={() => updateItem(item._id, item.quantity + 1)}>+</QtyBtn>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            {[['Subtotal', fmt(subtotal)], ['Tax (8%)', fmt(tax)], ['Delivery', 'FREE']].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                <span style={{ color: 'var(--mist)' }}>{l}</span>
                <span style={{ fontWeight: 600, color: l === 'Delivery' ? 'var(--success)' : 'var(--chalk)' }}>{v}</span>
              </div>
            ))}
            <div className="divider" style={{ margin: '14px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <span style={{ fontWeight: 800, fontSize: 18 }}>Total</span>
              <span style={{ fontWeight: 900, fontSize: 24, color: 'var(--brand)', fontFamily: 'Fraunces, serif' }}>{fmt(total)}</span>
            </div>
            <button className="btn-primary" onClick={handleCheckout} style={{ width: '100%', padding: '15px', fontSize: 16 }}>
              Checkout · {fmt(total)}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

function QtyBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{ width: 30, height: 30, borderRadius: 99, background: 'var(--ink-4)', border: '1px solid var(--border-2)', color: 'var(--chalk)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cabinet Grotesk, sans-serif' }}>
      {children}
    </button>
  )
}
