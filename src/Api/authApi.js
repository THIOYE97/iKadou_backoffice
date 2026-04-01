import api from './axiosInstance';

export const authApi = {
  login: async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    return data.data;
  },

  logout: async (payload) => {
    const { data } = await api.post('/auth/logout', payload);
    return data;
  },

  me: async () => {
    const { data } = await api.get('/auth/me');
    return data.data;
  },

  refresh: async (refreshToken) => {
    const { data } = await api.post('/auth/refresh', { refreshToken });
    return data.data;
  },

  changePassword: async (payload) => {
    const { data } = await api.post('/auth/change-password', payload);
    return data;
  },
};
