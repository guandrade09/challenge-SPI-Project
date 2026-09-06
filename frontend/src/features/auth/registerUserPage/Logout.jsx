import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';

export function Logout() {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Limpa o Zustand e o LocalStorage (via persist)
    logout(); 
    
    // 2. Manda o usuário de volta para a estaca zero
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  return null; // Não renderiza nada na tela
}

export default Logout;