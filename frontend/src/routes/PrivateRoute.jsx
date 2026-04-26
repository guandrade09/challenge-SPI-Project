import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export const PrivateRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  // Se não estiver logado, manda para o login
  return isAuthenticated ? children : <Navigate to="/login" />;
};