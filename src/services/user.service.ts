import api, { handleApiError } from './api';
import type { CreateUserPayload, UpdateUserPayload, User } from '@/types/user.types';

function normalizeUsersResponse(response: unknown): User[] {
  if (Array.isArray(response)) return response as User[];

  if (response && typeof response === 'object') {
    const record = response as Record<string, unknown>;
    if (Array.isArray(record.content)) return record.content as User[];
    if (Array.isArray(record.data)) return record.data as User[];
  }

  return [];
}

export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await api.get('/users');
    return normalizeUsersResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const createUser = async (payload: CreateUserPayload): Promise<void> => {
  try {
    await api.post('/users', payload);
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateUser = async (id: string, payload: UpdateUserPayload): Promise<void> => {
  try {
    await api.put(`/users/${id}`, payload);
  } catch (error) {
    return handleApiError(error);
  }
};

export const deleteUser = async (id: string): Promise<void> => {
  try {
    await api.delete(`/users/${id}`);
  } catch (error) {
    return handleApiError(error);
  }
};
