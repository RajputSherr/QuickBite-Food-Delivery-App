import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { cartService } from '../services'
import { useAuth } from './AuthContext'
import { TAX_RATE } from '../utils/helpers'
import toast from 'react-hot-toast'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) { setItems([]); return }
    setLoading(true)
    cartService.getCart()
      .then(cart => setItems(cart?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const addItem = useCallback(async (menuItem) => {
    if (!user) return false
    try {
      const cart = await cartService.addItem(menuItem._id)
      setItems(cart.items)
      toast.success(`${menuItem.emoji} Added to cart!`, { duration: 1800 })
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add item')
      return false
    }
  }, [user])

  const updateItem = useCallback(async (itemId, quantity) => {
    try {
      const cart = await cartService.updateItem(itemId, quantity)
      setItems(cart.items)
    } catch {
      toast.error('Failed to update cart')
    }
  }, [])

  const removeItem = useCallback(async (itemId) => {
    try {
      const cart = await cartService.removeItem(itemId)
      setItems(cart.items)
      toast('Item removed', { icon: '🗑️', duration: 1500 })
    } catch {
      toast.error('Failed to remove item')
    }
  }, [])

  const clearCart = useCallback(async () => {
    try { await cartService.clearCart(); setItems([]) } catch { /* silent */ }
  }, [])

  const subtotal  = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const tax       = +(subtotal * TAX_RATE).toFixed(2)
  const total     = +(subtotal + tax).toFixed(2)
  const itemCount = items.reduce((s, i) => s + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, loading, addItem, updateItem, removeItem, clearCart, subtotal, tax, total, itemCount }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be inside CartProvider')
  return ctx
}
