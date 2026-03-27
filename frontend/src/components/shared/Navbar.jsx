import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useApp } from '../../context/AppContext'
import NotificationPanel, { useNotifications } from '../notifications/NotificationPanel'

export default function Navbar({ onCartOpen, onAuthOpen }) {
  const { user, logout }         = useAuth()
  const { itemCount }            = useCart()
  const { theme, toggleTheme, vegMode, toggleVeg, points } = useApp()
  const { notifs, add, markRead, markAllRead, clear, unreadCount } = useNotifications()
  const location                 = useLocation()
  const [scrolled, setScrolled]  = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const isActive = (path) => location.pathname === path

  return (
    <nav style={{
      position:'fixed', top:0, left:0, right:0, zIndex:100, height:68,
      background: scrolled
        ? theme==='light' ? 'rgba(255,255,255,0.95)' : 'rgba(12,12,15,0.95)'
        : theme==='light' ? 'rgba(255,255,255,0.7)'  : 'rgba(12,12,15,0.6)',
      backdropFilter:'blur(24px)',
      borderBottom:`1px solid ${scrolled ? 'var(--border-2)' : 'transparent'}`,
      transition:'background 0.3s, border-color 0.3s',
      display:'flex', alignItems:'center', padding:'0 24px', gap:6,
    }}>
      {/* Logo */}
      <Link to="/" style={{ textDecoration:'none', marginRight:'auto', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:'var(--brand)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:900, color:'#fff', boxShadow:'0 4px 12px rgba(249,115,22,0.4)' }}>Q</div>
        <span style={{ fontFamily:'Fraunces, serif', fontSize:20, fontWeight:900, color:'var(--chalk)', letterSpacing:'-0.02em' }}>QuickBite</span>
      </Link>

      {/* Nav links */}
      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
        {[{ to:'/', label:'Menu' }, { to:'/orders', label:'Orders' }, { to:'/profile', label:'Profile' }].map(({ to, label }) => (
          <Link key={to} to={to} style={{ textDecoration:'none' }}>
            <button style={{ padding:'7px 13px', borderRadius:99, border:'none', background:isActive(to)?'rgba(249,115,22,0.12)':'transparent', color:isActive(to)?'var(--brand)':'var(--mist)', fontFamily:'Cabinet Grotesk, sans-serif', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.18s' }}>
              {label}
            </button>
          </Link>
        ))}
      </div>

      {/* Right */}
      <div style={{ display:'flex', alignItems:'center', gap:7, marginLeft:8 }}>
        {/* Veg toggle */}
        <button onClick={toggleVeg} title={vegMode?'Veg Mode ON':'Veg Mode OFF'} style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 11px', borderRadius:99, border:`2px solid ${vegMode?'var(--success)':'var(--border-2)'}`, background:vegMode?'rgba(34,197,94,0.12)':'transparent', color:vegMode?'var(--success)':'var(--mist)', cursor:'pointer', fontSize:11, fontWeight:700, fontFamily:'Cabinet Grotesk, sans-serif', transition:'all 0.2s' }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:vegMode?'var(--success)':'var(--mist)', display:'inline-block' }} />
          VEG
        </button>

        {/* Theme */}
        <button onClick={toggleTheme} style={{ width:34, height:34, borderRadius:'50%', background:'var(--ink-3)', border:'1px solid var(--border-2)', color:'var(--chalk)', cursor:'pointer', fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}>
          {theme==='dark'?'☀️':'🌙'}
        </button>

        {/* Points */}
        {user && (
          <Link to="/profile" style={{ textDecoration:'none' }}>
            <div style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:99, background:'rgba(249,115,22,0.1)', border:'1px solid rgba(249,115,22,0.2)', fontSize:11, fontWeight:700, color:'var(--brand)', cursor:'pointer' }}>
              ⭐ {points}
            </div>
          </Link>
        )}

        {/* Notifications */}
        {user && (
          <NotificationPanel notifs={notifs} onMarkRead={markRead} onMarkAllRead={markAllRead} onClear={clear} />
        )}

        {/* Auth */}
        {user ? (
          <>
            <span style={{ fontSize:12, color:'var(--mist)', maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>👤 {user.name}</span>
            <button className="btn-ghost" onClick={logout} style={{ padding:'6px 13px', fontSize:12 }}>Logout</button>
          </>
        ) : (
          <>
            <button className="btn-ghost"   onClick={() => onAuthOpen('login')}    style={{ padding:'6px 14px', fontSize:13 }}>Login</button>
            <button className="btn-primary" onClick={() => onAuthOpen('register')} style={{ padding:'6px 14px', fontSize:13 }}>Sign Up</button>
          </>
        )}

        {/* Cart */}
        <button onClick={onCartOpen} style={{ position:'relative', background:'var(--ink-3)', border:'1px solid var(--border-2)', borderRadius:99, padding:'7px 14px', color:'var(--chalk)', cursor:'pointer', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:6, fontFamily:'Cabinet Grotesk, sans-serif', transition:'background 0.2s' }}>
          🛒 Cart
          {itemCount > 0 && (
            <span style={{ position:'absolute', top:-7, right:-7, background:'var(--brand)', color:'#fff', fontSize:10, fontWeight:800, minWidth:18, height:18, borderRadius:99, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px', boxShadow:'0 2px 8px rgba(249,115,22,0.5)' }}>
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  )
}
