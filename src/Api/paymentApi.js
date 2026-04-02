import api from './axiosInstance';

export const paymentApi = {
  // Liste paginée / filtrée
  list: (params) =>
    api.get('/payments', { params }).then((r) => r.data),

  // Détail d’un paiement
  get: (id) =>
    api.get(`/payments/${id}`).then((r) => r.data),

  // Stripe
  createStripeIntent: (payload) =>
    api.post('/payments/stripe/intent', payload).then((r) => r.data),

  createStripeCheckout: (payload) =>
    api.post('/payments/stripe/checkout', payload).then((r) => r.data),

  // DanaPay
  createDanaPayTransfer: (payload) =>
    api.post('/payments/danapay/transfer', payload).then((r) => r.data),

  createDanaPayLink: (payload) =>
    api.post('/payments/danapay/link', payload).then((r) => r.data),

  // Plan échelonné
  createPlan: (payload) =>
    api.post('/payments/plans', payload).then((r) => r.data),

  // Changement manuel de statut
  updateStatus: (id, payload) =>
    api.patch(`/payments/${id}/status`, payload).then((r) => r.data),

  // Sync provider
  sync: (id) =>
    api.post(`/payments/${id}/sync`).then((r) => r.data),

  // Remboursement
  refund: (id, payload) =>
    api.post(`/payments/${id}/refund`, payload).then((r) => r.data),

  // Opérateurs Mobile Money
  getOperators: (countryCode) =>
    api.get(`/payments/operators/${countryCode}`).then((r) => r.data),
};

export default paymentApi;