// src/routes/PrivateRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export const PrivateRoute = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Se o usuário estiver autenticado, o <Outlet /> renderiza o MainLayout e as páginas internas.
  // Se não estiver, ele é redirecionado para o /login de forma segura.
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};