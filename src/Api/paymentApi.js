import api from './axiosInstance';

export const paymentApi = {
  // ── List & detail ──────────────────────────────────────
  list: (params) => api.get('/payments', { params }).then(r => r.data),
  get:  (id)     => api.get(`/payments/${id}`).then(r => r.data),

  // ── KPI stats (full dataset, not paged) ────────────────
  stats: (params) => api.get('/payments/stats', { params }).then(r => r.data),

  // ── Operators by country (DanaPay) ─────────────────────
  getOperators: (countryCode) =>
    api.get(`/payments/operators/${countryCode}`).then(r => r.data),

  // ── Stripe ─────────────────────────────────────────────
  createStripeIntent:   (data) =>
    api.post('/payments/stripe/intent', data).then(r => r.data),
  createStripeCheckout: (data) =>
    api.post('/payments/stripe/checkout', data).then(r => r.data),

  // ── DanaPay ────────────────────────────────────────────
  createDanaPayTransfer: (data) =>
    api.post('/payments/danapay/transfer', data).then(r => r.data),
  createDanaPayLink: (data) =>
    api.post('/payments/danapay/link', data).then(r => r.data),

  // ── Actions ────────────────────────────────────────────
  sync:         (id)       => api.post(`/payments/${id}/sync`).then(r => r.data),
  refund:       (id, data) => api.post(`/payments/${id}/refund`, data).then(r => r.data),
  updateStatus: (id, data) => api.patch(`/payments/${id}/status`, data).then(r => r.data),

  // ── Proofs review ──────────────────────────────────────
  listProofs: (paymentId) =>
    api.get(`/payments/${paymentId}/proofs`).then(r => r.data),

  reviewProof: (proofId, data) =>
    api.patch(`/payments/proofs/${proofId}/review`, data).then(r => r.data),

  // ── Installment plan ───────────────────────────────────
  createPlan: (data) => api.post('/payments/installment', data).then(r => r.data),
};