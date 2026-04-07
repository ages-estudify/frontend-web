import api from './api';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from '@/types/auth.types';

export const login = async (payload: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post('/auth/login', payload);
  return response.data;
};

export const register = async (body: RegisterRequest): Promise<RegisterResponse> => {
  const response = await api.post('/auth/register', body);
  return response.data;
};
