import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Confetti from '../ui/Confetti'
import { fmt } from '../../utils/helpers'
import { useApp } from '../../context/AppContext'

export default function OrderSuccessScreen({ order, onClose }) {
  const navigate    = useNavigate()
  const { addPoints } = useApp()
  const [confetti, setConfetti] = useState(true)
  const [countdown, setCountdown] = useState(8)

  useEffect(() => {
    // Add loyalty points (10 per $1 spent)
    if (order?.total) addPoints(Math.floor(order.total * 10))
  }, [order, addPoints])

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(t); navigate(`/orders/${order?._id}`); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [navigate, order])

  if (!order) return null

  return (
    <>
      <Confetti active={confetti} onDone={() => setConfetti(false)} />
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)', zIndex: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <div className="anim-scale-in" style={{
          background: 'var(--ink-2)', border: '1px solid var(--border-2)',
          borderRadius: 28, padding: '44px 40px', maxWidth: 460, width: '100%',
          textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
        }}>
          {/* Animated checkmark */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--success), #16a34a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, margin: '0 auto 20px',
            boxShadow: '0 8px 32px rgba(34,197,94,0.4)',
            animation: 'scaleIn 0.5s cubic-bezier(.34,1.56,.64,1)',
          }}>✅</div>

          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 900, marginBottom: 8 }}>
            Order Placed! 🎉
          </h2>
          <p style={{ color: 'var(--mist)', fontSize: 15, marginBottom: 24 }}>
            Your food is being prepared with love
          </p>

          {/* Order details */}
          <div style={{ background: 'var(--ink-3)', borderRadius: 16, padding: '16px 20px', marginBottom: 20, textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--mist)', fontSize: 13 }}>Order ID</span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>#{order._id?.slice(-8).toUpperCase()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--mist)', fontSize: 13 }}>Total Paid</span>
              <span style={{ fontWeight: 800, color: 'var(--brand)', fontFamily: 'Fraunces, serif', fontSize: 16 }}>{fmt(order.total)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--mist)', fontSize: 13 }}>Est. Delivery</span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>~25–35 minutes</span>
            </div>
          </div>

          {/* Points earned */}
          <div style={{
            background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)',
            borderRadius: 12, padding: '10px 16px', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center',
          }}>
            <span style={{ fontSize: 20 }}>⭐</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand)' }}>
              You earned +{Math.floor((order.total || 0) * 10)} loyalty points!
            </span>
          </div>

          {/* Buttons */}
          <button className="btn-primary" onClick={() => navigate(`/orders/${order._id}`)} style={{ width: '100%', padding: '14px', fontSize: 15, marginBottom: 10 }}>
            🛵 Track My Order
          </button>
          <button className="btn-ghost" onClick={onClose} style={{ width: '100%', padding: '12px', fontSize: 14 }}>
            Continue Browsing
          </button>

          <p style={{ color: 'var(--mist)', fontSize: 12, marginTop: 16 }}>
            Redirecting to order tracking in {countdown}s...
          </p>
        </div>
      </div>
    </>
  )
}
