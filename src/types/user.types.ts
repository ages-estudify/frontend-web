export type User = {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string | null;
  role: string;
  plan_end_date?: string | null;
  enable: boolean;
  streak: number;
  coins: number;
  createdAt: string;
  desired_course?: string | null;
  desired_university?: string | null;
  preferred_language?: string | null;
  last_active?: string | null;
  birth_date?: string | null;
  onboarding_completed?: boolean;
};

export type UserFormData = {
  full_name: string;
  email: string;
  password: string;
  phone_number: string;
  role: string;
  plan_end_date: string;
  preferred_language: string;
  desired_course: string;
  desired_university: string;
  birth_date: string;
  streak: string;
  coins: string;
};

export type CreateUserPayload = {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  birthDate: string;
};

export type UpdateUserPayload = {
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
  planEndDate?: string;
  streak?: number;
  coins?: number;
  desiredCourse?: string;
  desiredUniversity?: string;
  preferredLanguage?: string;
  birthDate?: string;
};
