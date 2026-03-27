import api from './api'

export const adminService = {
  getStats:      ()           => api.get('/admin/stats').then(r => r.data),
  getOrders:     (status)     => api.get('/admin/orders', { params: { status } }).then(r => r.data),
  updateStatus:  (id, status) => api.patch(`/admin/orders/${id}/status`, { status }).then(r => r.data),
  getMenuItems:  ()           => api.get('/admin/menu').then(r => r.data),
  createItem:    (data)       => api.post('/admin/menu', data).then(r => r.data),
  updateItem:    (id, data)   => api.put(`/admin/menu/${id}`, data).then(r => r.data),
  deleteItem:    (id)         => api.delete(`/admin/menu/${id}`).then(r => r.data),
  getUsers:      ()           => api.get('/admin/users').then(r => r.data),
}
