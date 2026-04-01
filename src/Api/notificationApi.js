import api from './axiosInstance';

export const notificationApi = {
  // Journal
  list:   (params) => api.get('/notifications', { params }).then(r => r.data),
  get:    (id)     => api.get(`/notifications/${id}`).then(r => r.data),
  resend: (id)     => api.post(`/notifications/${id}/resend`).then(r => r.data),

  // Stats
  stats:  (params) => api.get('/notifications/stats/summary', { params }).then(r => r.data),

  // Templates
  templatesList:   ()       => api.get('/notifications/templates/list').then(r => r.data),
  templateGet:     (id)     => api.get(`/notifications/templates/${id}`).then(r => r.data),
  templateUpdate:  (id, d)  => api.patch(`/notifications/templates/${id}`, d).then(r => r.data),

  // Settings
  getSettings:    ()        => api.get('/notifications/settings').then(r => r.data),
  updateSettings: (data)    => api.patch('/notifications/settings', { settings: data }).then(r => r.data),

  // Send
  send:      (data) => api.post('/notifications/send', data).then(r => r.data),
  broadcast: (data) => api.post('/notifications/broadcast', data).then(r => r.data),

  // Client prefs
  getClientPrefs:    (clientId)        => api.get(`/clients/${clientId}/notification-prefs`).then(r => r.data),
  updateClientPrefs: (clientId, data)  => api.patch(`/clients/${clientId}/notification-prefs`, data).then(r => r.data),
  getClientTokens:   (clientId)        => api.get(`/clients/${clientId}/device-tokens`).then(r => r.data),
  deleteClientToken: (clientId, tokenId) => api.delete(`/clients/${clientId}/device-tokens/${tokenId}`).then(r => r.data),
};
