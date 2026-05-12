import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export const PrivateRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" />;
};