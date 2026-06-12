import type { UserFormData } from '@/types/user.types';

export const ROLE_OPTIONS = ['USER', 'ADMIN'];
export const LANGUAGE_OPTIONS = ['pt-BR', 'en-US', 'es-ES'];

export const initialUserFormState: UserFormData = {
  full_name: '',
  email: '',
  password: '',
  phone_number: '',
  role: '',
  plan_end_date: '',
  preferred_language: '',
  desired_course: '',
  desired_university: '',
  birth_date: '',
  streak: '',
  coins: '',
};
