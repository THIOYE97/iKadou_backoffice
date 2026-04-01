import { createContext, useContext, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchMe } from '@/Redux/Auth/authSlice';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    // On mount, try to restore session from stored token
    const token = localStorage.getItem('accessToken');
    if (token) {
      dispatch(fetchMe());
    } else {
      // Mark as initialized even if no token
      dispatch({ type: 'auth/fetchMe/rejected' });
    }
  }, [dispatch]);

  return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>;
}

export const useAuthContext = () => useContext(AuthContext);
