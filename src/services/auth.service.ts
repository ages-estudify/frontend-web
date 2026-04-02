const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  data: {
    token: string
    role: string
    planActive: boolean
  }
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error?.message ?? 'Não foi possível realizar login. Tente novamente.')
  }

  return response.json()
}