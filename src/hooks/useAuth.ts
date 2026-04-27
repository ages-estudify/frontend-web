import { useNavigate } from 'react-router-dom';
import { login as loginService } from '@/services/auth.service';
import { storage } from '@/utils/storage';

export function useAuth() {
  const navigate = useNavigate();

  async function login(email: string, password: string) {
    const response = await loginService({ email, password });
    const { token, role, planExpirationDate } = response;

    if (role !== 'ADM') {
      throw new Error('Acesso restrito ao painel administrativo.');
    }

    storage.setToken(token);
    storage.setRole(role);
    storage.setPlanActive(planExpirationDate > new Date());
    navigate('/');
  }

  function logout() {
    storage.clear();
    navigate('/login');
  }

  return { login, logout };
}
