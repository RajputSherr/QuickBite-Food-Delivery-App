import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { authService } from '../services'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const logoutRef = useRef(null)

  const logout = useCallback(() => {
    localStorage.removeItem('qb_token')
    localStorage.removeItem('qb_user')
    setUser(null)
    toast('Logged out. See you soon! 👋')
  }, [])

  logoutRef.current = logout

  useEffect(() => {
    const token = localStorage.getItem('qb_token')
    if (!token) { setLoading(false); return }
    const stored = localStorage.getItem('qb_user')
    if (stored) setUser(JSON.parse(stored))
    authService.getMe()
      .then(u => { setUser(u); localStorage.setItem('qb_user', JSON.stringify(u)) })
      .catch(() => logoutRef.current())
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await authService.login({ email, password })
    localStorage.setItem('qb_token', data.token)
    localStorage.setItem('qb_user', JSON.stringify(data))
    setUser(data)
    toast.success(`Welcome back, ${data.name}! 👋`)
    return data
  }, [])

  const register = useCallback(async (name, email, password) => {
    const data = await authService.register({ name, email, password })
    localStorage.setItem('qb_token', data.token)
    localStorage.setItem('qb_user', JSON.stringify(data))
    setUser(data)
    toast.success(`Welcome to QuickBite, ${data.name}! 🎉`)
    return data
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
