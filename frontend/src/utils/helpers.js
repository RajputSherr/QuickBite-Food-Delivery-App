export const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

export const fmtTime = (d) =>
  new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

export const TAX_RATE = 0.08

export const ORDER_STEPS = [
  { key: 'placed',           label: 'Order Placed',     icon: '✅', desc: 'We received your order' },
  { key: 'preparing',        label: 'Preparing',        icon: '👨‍🍳', desc: 'Kitchen is on it' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🛵', desc: 'On the way to you' },
  { key: 'delivered',        label: 'Delivered',        icon: '🏠', desc: 'Enjoy your meal!' },
]

export const STATUS_MAP = {
  placed:           { label: 'Order Placed',     color: '#f97316', step: 0 },
  preparing:        { label: 'Preparing',        color: '#f97316', step: 1 },
  out_for_delivery: { label: 'Out for Delivery', color: '#f97316', step: 2 },
  delivered:        { label: 'Delivered',        color: '#22c55e', step: 3 },
  cancelled:        { label: 'Cancelled',        color: '#ef4444', step: -1 },
}

export const getStep = (status) => STATUS_MAP[status]?.step ?? 0
