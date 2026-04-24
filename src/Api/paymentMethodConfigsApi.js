import api from './axiosInstance';

export const paymentMethodConfigsApi = {
  // ── List & detail ──────────────────────────────────────
  list: () =>
    api.get('/payment-method-configs').then((r) => r.data),

  get: (id) =>
    api.get(`/payment-method-configs/${id}`).then((r) => r.data),

  // ── Create & update ────────────────────────────────────
  create: (data) =>
    api.post('/payment-method-configs', data).then((r) => r.data),

  update: (id, data) =>
    api.patch(`/payment-method-configs/${id}`, data).then((r) => r.data),

  // ── Toggle active / inactive ───────────────────────────
  toggle: (id, isActive) =>
    api.patch(`/payment-method-configs/${id}/toggle`, { isActive }).then((r) => r.data),
};