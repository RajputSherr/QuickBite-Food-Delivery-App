import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AppContext = createContext(null)

const LEVELS = [
  { name: 'Bronze',   min: 0,    icon: '🥉', color: '#cd7f32' },
  { name: 'Silver',   min: 500,  icon: '🥈', color: '#c0c0c0' },
  { name: 'Gold',     min: 1500, icon: '🥇', color: '#ffd700' },
  { name: 'Platinum', min: 3000, icon: '💎', color: '#b9f2ff' },
]

export function AppProvider({ children }) {
  const [theme,    setTheme]    = useState(localStorage.getItem('qb_theme') || 'dark')
  const [vegMode,  setVegMode]  = useState(localStorage.getItem('qb_veg') === 'true')
  const [favorites,setFavorites]= useState(() => JSON.parse(localStorage.getItem('qb_favs') || '[]'))
  const [points,   setPoints]   = useState(() => parseInt(localStorage.getItem('qb_points') || '0'))
  const [fontSize, setFontSize] = useState(localStorage.getItem('qb_fontsize') || 'medium')
  const [language, setLanguage] = useState(localStorage.getItem('qb_lang') || 'en')
  const [wallet,   setWallet]   = useState(() => parseFloat(localStorage.getItem('qb_wallet') || '0'))
  const [streak,   setStreak]   = useState(() => parseInt(localStorage.getItem('qb_streak') || '0'))
  const [referralCode] = useState(() => {
    const existing = localStorage.getItem('qb_referral')
    if (existing) return existing
    const code = 'QB' + Math.random().toString(36).substr(2,6).toUpperCase()
    localStorage.setItem('qb_referral', code)
    return code
  })

  // Get user level based on points
  const getLevel = useCallback((pts) => {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (pts >= LEVELS[i].min) return LEVELS[i]
    }
    return LEVELS[0]
  }, [])

  const level = getLevel(points)
  const nextLevel = LEVELS[LEVELS.findIndex(l => l.name === level.name) + 1]
  const levelProgress = nextLevel ? ((points - level.min) / (nextLevel.min - level.min)) * 100 : 100

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('qb_theme', theme)
    const r = document.documentElement.style
    if (theme === 'light') {
      r.setProperty('--ink',     '#ffffff')
      r.setProperty('--ink-2',   '#f8f8f8')
      r.setProperty('--ink-3',   '#f0f0f0')
      r.setProperty('--ink-4',   '#e0e0e0')
      r.setProperty('--chalk',   '#1a1a1a')
      r.setProperty('--chalk-2', '#333333')
      r.setProperty('--mist',    '#666666')
      r.setProperty('--border',  'rgba(0,0,0,0.08)')
      r.setProperty('--border-2','rgba(0,0,0,0.12)')
    } else {
      r.setProperty('--ink',     '#0c0c0f')
      r.setProperty('--ink-2',   '#18181f')
      r.setProperty('--ink-3',   '#232330')
      r.setProperty('--ink-4',   '#2e2e3f')
      r.setProperty('--chalk',   '#f5f0eb')
      r.setProperty('--chalk-2', '#e8e0d5')
      r.setProperty('--mist',    '#9090a8')
      r.setProperty('--border',  'rgba(255,255,255,0.06)')
      r.setProperty('--border-2','rgba(255,255,255,0.1)')
    }
  }, [theme])

  useEffect(() => {
    const sizes = { small:'13px', medium:'15px', large:'17px' }
    document.body.style.fontSize = sizes[fontSize] || '15px'
    localStorage.setItem('qb_fontsize', fontSize)
  }, [fontSize])

  useEffect(() => { localStorage.setItem('qb_veg',       vegMode)                    }, [vegMode])
  useEffect(() => { localStorage.setItem('qb_favs',      JSON.stringify(favorites))  }, [favorites])
  useEffect(() => { localStorage.setItem('qb_points',    points)                     }, [points])
  useEffect(() => { localStorage.setItem('qb_lang',      language)                   }, [language])
  useEffect(() => { localStorage.setItem('qb_wallet',    wallet)                     }, [wallet])
  useEffect(() => { localStorage.setItem('qb_streak',    streak)                     }, [streak])

  const toggleFavorite = useCallback((id) => {
    setFavorites(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id])
  }, [])

  const isFavorite  = useCallback((id) => favorites.includes(id), [favorites])
  const addPoints   = useCallback((n) => setPoints(p => p + Math.floor(n)), [])
  const toggleTheme = useCallback(() => setTheme(p => p === 'dark' ? 'light' : 'dark'), [])
  const toggleVeg   = useCallback(() => setVegMode(p => !p), [])
  const addToWallet = useCallback((n) => setWallet(p => +(p + n).toFixed(2)), [])
  const payFromWallet = useCallback((n) => {
    setWallet(p => { if (p < n) return p; return +(p - n).toFixed(2) })
  }, [])
  const incrementStreak = useCallback(() => setStreak(p => p + 1), [])

  return (
    <AppContext.Provider value={{
      theme, setTheme, toggleTheme,
      vegMode, setVegMode, toggleVeg,
      favorites, toggleFavorite, isFavorite,
      points, addPoints, setPoints,
      fontSize, setFontSize,
      language, setLanguage,
      wallet, addToWallet, payFromWallet,
      streak, incrementStreak,
      referralCode,
      level, nextLevel, levelProgress,
      getLevel, LEVELS,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}
