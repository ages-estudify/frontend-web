import api from './api';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from '@/types/auth.types';

export const login = async (body: LoginRequest): Promise<LoginResponse> => {
  const response: LoginResponse = await api.post('/auth/login', body);
  return response;
};

export const register = async (body: RegisterRequest): Promise<RegisterResponse> => {
  const response: RegisterResponse = await api.post('/auth/register', body);
  return response;
};
