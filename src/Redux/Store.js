import { configureStore } from '@reduxjs/toolkit';
import authReducer from './Auth/authSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    // Phase 2+:
    // leads: leadsReducer,
    // clients: clientsReducer,
    // terrains: terrainsReducer,
    // visits: visitsReducer,
    // payments: paymentsReducer,
    // support: supportReducer,
    // agents: agentsReducer,
    // notifications: notificationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/loginSuccess'],
      },
    }),
});

export default store;
