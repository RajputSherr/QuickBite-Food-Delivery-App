import React, { useState, useEffect, useCallback } from 'react'
import { fmtTime } from '../../utils/helpers'

const STORAGE_KEY = 'qb_notifications'

export function useNotifications() {
  const [notifs, setNotifs] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs.slice(0, 50)))
  }, [notifs])

  const add = useCallback((msg, type = 'info', icon = '🔔') => {
    const notif = { id: Date.now(), msg, type, icon, time: new Date().toISOString(), read: false }
    setNotifs(prev => [notif, ...prev].slice(0, 50))

    // Browser push notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('QuickBite 🔥', { body: msg, icon: '/favicon.ico' })
    }
    return notif
  }, [])

  const markRead   = useCallback((id) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)), [])
  const markAllRead = useCallback(() => setNotifs(prev => prev.map(n => ({ ...n, read: true }))), [])
  const clear      = useCallback(() => setNotifs([]), [])
  const unreadCount = notifs.filter(n => !n.read).length

  return { notifs, add, markRead, markAllRead, clear, unreadCount }
}

export default function NotificationPanel({ notifs, onMarkRead, onMarkAllRead, onClear }) {
  const [open, setOpen] = useState(false)
  const unread = notifs.filter(n => !n.read).length

  useEffect(() => {
    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const TYPE_STYLE = {
    success: { bg: 'rgba(34,197,94,0.1)',  color: 'var(--success)', icon: '✅' },
    error:   { bg: 'rgba(239,68,68,0.1)',  color: 'var(--danger)',  icon: '❌' },
    order:   { bg: 'rgba(249,115,22,0.1)', color: 'var(--brand)',   icon: '📦' },
    info:    { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6',        icon: '🔔' },
  }

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => { setOpen(p => !p); if (!open) onMarkAllRead?.() }} style={{
        position: 'relative', width: 36, height: 36, borderRadius: '50%',
        background: 'var(--ink-3)', border: '1px solid var(--border-2)',
        color: 'var(--chalk)', cursor: 'pointer', fontSize: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
      }}>
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: 'var(--danger)', color: '#fff',
            fontSize: 9, fontWeight: 800, minWidth: 16, height: 16,
            borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px', animation: 'pulse 1s ease-in-out infinite',
          }}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 148 }} />
          <div className="anim-scale-in" style={{
            position: 'absolute', top: 44, right: 0, width: 340,
            background: 'var(--ink-2)', border: '1px solid var(--border-2)',
            borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-lg)',
            zIndex: 149, maxHeight: 420, display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <span style={{ fontWeight: 800, fontSize: 15 }}>Notifications</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={onMarkAllRead} style={{ background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'Cabinet Grotesk, sans-serif' }}>Mark all read</button>
                <button onClick={onClear} style={{ background: 'none', border: 'none', color: 'var(--mist)', cursor: 'pointer', fontSize: 12, fontFamily: 'Cabinet Grotesk, sans-serif' }}>Clear</button>
              </div>
            </div>

            {/* List */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {notifs.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--mist)' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔕</div>
                  <p style={{ fontSize: 14 }}>No notifications yet</p>
                </div>
              ) : notifs.map(n => {
                const style = TYPE_STYLE[n.type] || TYPE_STYLE.info
                return (
                  <div key={n.id} onClick={() => onMarkRead?.(n.id)} style={{
                    padding: '12px 16px', borderBottom: '1px solid var(--border)',
                    background: n.read ? 'transparent' : style.bg,
                    cursor: 'pointer', transition: 'background 0.2s',
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                  }}>
                    <span style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>{n.icon || style.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: n.read ? 400 : 600, color: 'var(--chalk)', lineHeight: 1.4, marginBottom: 4 }}>{n.msg}</p>
                      <p style={{ fontSize: 11, color: 'var(--mist)' }}>{fmtTime(n.time)}</p>
                    </div>
                    {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: style.color, flexShrink: 0, marginTop: 6 }} />}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
