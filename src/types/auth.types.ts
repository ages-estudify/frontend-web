export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  birthDate: string;
}

export interface RegisterResponse {
  sucess: boolean;
  data: {
    userId: string;
    token: string;
    refreshToken: string;
    role: string;
    planExpirationDate: Date;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    role: string;
    planActive: boolean;
  };
}
