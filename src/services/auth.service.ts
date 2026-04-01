import api from './api';
import type { RegisterRequest, RegisterResponse } from '@/types/auth.types';

export const register = async (body: RegisterRequest): Promise<RegisterResponse> => {
  const response: RegisterResponse = await api.post('/auth/register', body);
  return response;
};

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    role: string;
    planExpirationDate: string;
  };
}

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  const response = await api.post('/auth/login', payload);

  return response.data;
};
