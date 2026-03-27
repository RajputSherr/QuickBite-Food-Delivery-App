import api from './api'

export const authService = {
  register: (data) => api.post('/auth/register', data).then(r => r.data),
  login:    (data) => api.post('/auth/login', data).then(r => r.data),
  getMe:    ()     => api.get('/auth/me').then(r => r.data),
}

export const menuService = {
  getItems:      (params) => api.get('/menu', { params }).then(r => r.data),
  getCategories: ()       => api.get('/menu/categories').then(r => r.data),
}

export const cartService = {
  getCart:    ()                 => api.get('/cart').then(r => r.data),
  addItem:    (menuItemId, qty)  => api.post('/cart', { menuItemId, quantity: qty || 1 }).then(r => r.data),
  updateItem: (itemId, quantity) => api.put(`/cart/${itemId}`, { quantity }).then(r => r.data),
  removeItem: (itemId)           => api.delete(`/cart/${itemId}`).then(r => r.data),
  clearCart:  ()                 => api.delete('/cart').then(r => r.data),
}

export const orderService = {
  place:     (data) => api.post('/orders', data).then(r => r.data),
  getOrders: ()     => api.get('/orders').then(r => r.data),
  getOrder:  (id)   => api.get(`/orders/${id}`).then(r => r.data),
  cancel:    (id)   => api.patch(`/orders/${id}/cancel`).then(r => r.data),
}
