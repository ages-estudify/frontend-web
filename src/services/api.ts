import axios, { type AxiosInstance } from 'axios';
import { storage } from '@/utils/storage';

export const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'}/api/v1`;

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use((response) => response.data);

export const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    throw error.response?.data ?? error.message;
  }

  throw error;
};

export default api;
