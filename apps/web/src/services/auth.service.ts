import { api } from "../lib/api";

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: "SUPER_ADMIN" | "HR_MANAGER" | "EMPLOYEE";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  employee: unknown | null;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    user: AuthUser;
  };
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  data: {
    message: string;
    emailSent: boolean;
    resetLink?: string;
    expiresInHours?: number;
  };
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
  data: {
    message: string;
  };
}

export async function login(input: LoginInput) {
  const response = await api.post<LoginResponse>(
    "/auth/login",
    input,
  );

  return response.data;
}

export async function forgotPassword(email: string) {
  const response = await api.post<ForgotPasswordResponse>(
    "/auth/forgot-password",
    { email },
  );

  return response.data;
}

export async function resetPassword(input: {
  token: string;
  password: string;
  confirmPassword: string;
}) {
  const response = await api.post<ResetPasswordResponse>(
    "/auth/reset-password",
    input,
  );

  return response.data;
}
