import api from './axiosInstance';

// ─── LEADS ────────────────────────────────────────────────
// Backend non partagé ici, je garde ta version actuelle

export const leadsApi = {
  list: (params) => api.get('/leads', { params }).then(r => r.data),
  get: (id) => api.get(`/leads/${id}`).then(r => r.data),
  create: (data) => api.post('/leads', data).then(r => r.data),
  update: (id, data) => api.patch(`/leads/${id}`, data).then(r => r.data),
  updateStatus: (id, data) => api.patch(`/leads/${id}/status`, data).then(r => r.data),
  assign: (id, agentId) => api.patch(`/leads/${id}/assign`, { agentId }).then(r => r.data),
  addNote: (id, content) => api.post(`/leads/${id}/notes`, { content }).then(r => r.data),
  deleteNote: (id, noteId) => api.delete(`/leads/${id}/notes/${noteId}`).then(r => r.data),
};

// ─── CLIENTS ──────────────────────────────────────────────

export const clientsApi = {
  list: (params) => api.get('/clients', { params }).then(r => r.data),
  get: (id) => api.get(`/clients/${id}`).then(r => r.data),
  create: (data) => api.post('/clients', data).then(r => r.data),
  update: (id, data) => api.patch(`/clients/${id}`, data).then(r => r.data),
  updateStatus: (id, data) => api.patch(`/clients/${id}/status`, data).then(r => r.data),
};

// ─── TERRAINS ─────────────────────────────────────────────
// Backend non partagé ici, je garde ta version actuelle

export const terrainsApi = {
  list: (params) => api.get('/terrains', { params }).then(r => r.data),
  get: (id) => api.get(`/terrains/${id}`).then(r => r.data),
  create: (data) => api.post('/terrains', data).then(r => r.data),
  update: (id, data) => api.patch(`/terrains/${id}`, data).then(r => r.data),
  updateStatus: (id, data) => api.patch(`/terrains/${id}/status`, data).then(r => r.data),

  uploadImages: (id, formData) =>
    api.post(`/terrains/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),

  listImages: (id) =>
    api.get(`/terrains/${id}/images`).then(r => r.data),

  reorderImages: (id, orderedUrls) =>
    api.patch(`/terrains/${id}/images/reorder`, { orderedUrls }).then(r => r.data),

  deleteImage: (id, storageKey) =>
    api.delete(`/terrains/${id}/images`, { data: { storageKey } }).then(r => r.data),

  setMainImage: (id, storageKey) =>
    api.patch(`/terrains/${id}/images/main`, { storageKey }).then(r => r.data),

  uploadDocuments: (id, formData) =>
    api.post(`/terrains/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),

  listDocuments: (id) =>
    api.get(`/terrains/${id}/documents`).then(r => r.data),

  deleteDocument: (id, documentId) =>
    api.delete(`/terrains/${id}/documents/${documentId}`).then(r => r.data),
};

// ─── ZONES ────────────────────────────────────────────────
// Backend non partagé ici, je garde ta version actuelle

export const zonesApi = {
  list: () => api.get('/zones').then(r => r.data),
  create: (data) => api.post('/zones', data).then(r => r.data),
  update: (id, data) => api.patch(`/zones/${id}`, data).then(r => r.data),
};

// ─── AGENTS ───────────────────────────────────────────────

export const agentsApi = {
  list: (params) => api.get('/agents', { params }).then(r => r.data),
  get: (id) => api.get(`/agents/${id}`).then(r => r.data),
  create: (data) => api.post('/agents', data).then(r => r.data),
  update: (id, data) => api.patch(`/agents/${id}`, data).then(r => r.data),
  getPerformance: (id, params) => api.get(`/agents/${id}/performance`, { params }).then(r => r.data),
  assignZone: (id, zoneId) => api.post(`/agents/${id}/zones`, { zoneId }).then(r => r.data),
  removeZone: (id, zoneId) => api.delete(`/agents/${id}/zones/${zoneId}`).then(r => r.data),
};

// ─── VISITS ───────────────────────────────────────────────

export const visitsApi = {
  list: (params) => api.get('/visits', { params }).then(r => r.data),
  get: (id) => api.get(`/visits/${id}`).then(r => r.data),
  create: (data) => api.post('/visits', data).then(r => r.data),
  updateStatus: (id, data) => api.patch(`/visits/${id}/status`, data).then(r => r.data),
  reschedule: (id, data) => api.patch(`/visits/${id}/reschedule`, data).then(r => r.data),
};

// ─── TICKETS ──────────────────────────────────────────────

export const ticketsApi = {
  list: (params) => api.get('/tickets', { params }).then(r => r.data),
  get: (id) => api.get(`/tickets/${id}`).then(r => r.data),
  create: (data) => api.post('/tickets', data).then(r => r.data),
  updateStatus: (id, data) => api.patch(`/tickets/${id}/status`, data).then(r => r.data),
  assign: (id, assignedTo) => api.patch(`/tickets/${id}/assign`, { assignedTo }).then(r => r.data),
  addMessage: (id, data) => api.post(`/tickets/${id}/messages`, data).then(r => r.data),

  uploadAttachments: (id, { files = [], messageId = null }) => {
    const formData = new FormData();

    if (messageId) {
      formData.append('messageId', messageId);
    }

    files.forEach((file) => {
      formData.append('files', file);
    });

    return api.post(`/tickets/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  listAssignableSupportUsers: () =>
    api.get('/tickets/assignable-support-users').then(r => r.data),
};


// ─── NOTIFICATIONS ────────────────────────────────────────

export const notificationsApi = {
  list: (params) => api.get('/notifications', { params }).then(r => r.data),
  get: (id) => api.get(`/notifications/${id}`).then(r => r.data),
  resend: (id) => api.post(`/notifications/${id}/resend`).then(r => r.data),

  send: (data) => api.post('/notifications/send', data).then(r => r.data),
  sendMulti: (data) => api.post('/notifications/send-multi', data).then(r => r.data),
  sendPushTopic: (data) => api.post('/notifications/push/topic', data).then(r => r.data),
  testConfig: (data) => api.post('/notifications/test-config', data).then(r => r.data),

  listTemplates: () => api.get('/notifications/templates/list').then(r => r.data),
  getTemplate: (id) => api.get(`/notifications/templates/${id}`).then(r => r.data),
  updateTemplate: (id, data) => api.patch(`/notifications/templates/${id}`, data).then(r => r.data),
};

// ─── DOCUMENTS ────────────────────────────────────────────

export const documentsApi = {
  list: (params) => api.get('/documents', { params }).then(r => r.data),
  get: (id) => api.get(`/documents/${id}`).then(r => r.data),

  create: (formData) =>
    api.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),

  remove: (id) => api.delete(`/documents/${id}`).then(r => r.data),
};

// ─── REPORTS ──────────────────────────────────────────────

export const reportsApi = {
  overview: (params) => api.get('/reports/overview', { params }).then(r => r.data),
  leads: (params) => api.get('/reports/leads', { params }).then(r => r.data),
  payments: (params) => api.get('/reports/payments', { params }).then(r => r.data),
  support: (params) => api.get('/reports/support', { params }).then(r => r.data),
};
