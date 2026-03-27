import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { useApp } from '../../context/AppContext'

export default function ReviewModal({ order, onClose }) {
  const { addPoints } = useApp()
  const [ratings, setRatings]   = useState({})
  const [overall, setOverall]   = useState(0)
  const [delivery, setDelivery] = useState(0)
  const [comment, setComment]   = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (!overall) { toast.error('Please rate your overall experience'); return }
    setSubmitted(true)
    addPoints(50) // 50 points for rating
    toast.success('⭐ Thanks for your review! +50 points earned!')
    setTimeout(onClose, 2000)
  }

  if (submitted) return (
    <div className="overlay">
      <div className="anim-scale-in" style={{ background: 'var(--ink-2)', border: '1px solid var(--border-2)', borderRadius: 24, padding: '44px 40px', maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Thanks for rating!</h2>
        <p style={{ color: 'var(--mist)' }}>You earned +50 loyalty points</p>
      </div>
    </div>
  )

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="anim-scale-in" style={{ background: 'var(--ink-2)', border: '1px solid var(--border-2)', borderRadius: 24, padding: '36px 32px', maxWidth: 480, width: '100%', boxShadow: 'var(--shadow-lg)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'var(--ink-3)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: 'var(--mist)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>

        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 24, fontWeight: 900, marginBottom: 6 }}>Rate Your Order</h2>
        <p style={{ color: 'var(--mist)', fontSize: 14, marginBottom: 24 }}>Order #{order._id?.slice(-8).toUpperCase()}</p>

        {/* Overall rating */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--mist)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Overall Experience *</p>
          <StarRating value={overall} onChange={setOverall} size={36} />
        </div>

        {/* Per item ratings */}
        {order.items?.slice(0, 3).map((item, i) => (
          <div key={i} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--ink-3)', borderRadius: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{item.emoji} {item.name}</span>
            <StarRating value={ratings[item.name] || 0} onChange={v => setRatings(r => ({...r, [item.name]: v}))} size={20} />
          </div>
        ))}

        {/* Delivery rating */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--mist)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Delivery Experience</p>
          <StarRating value={delivery} onChange={setDelivery} size={24} />
        </div>

        {/* Comment */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--mist)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Comments (optional)</p>
          <textarea className="input" rows={3} placeholder="Tell us about your experience..." value={comment} onChange={e => setComment(e.target.value)} style={{ resize: 'none' }} />
        </div>

        <button className="btn-primary" onClick={handleSubmit} style={{ width: '100%', padding: '14px', fontSize: 15 }}>
          Submit Review · +50 pts ⭐
        </button>
      </div>
    </div>
  )
}

function StarRating({ value, onChange, size = 28 }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1,2,3,4,5].map(s => (
        <button key={s} onClick={() => onChange(s)} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: size, padding: 2, transition: 'transform 0.1s', transform: (hover || value) >= s ? 'scale(1.15)' : 'scale(1)', filter: (hover || value) >= s ? 'none' : 'grayscale(1) opacity(0.4)' }}>
          ⭐
        </button>
      ))}
    </div>
  )
}
