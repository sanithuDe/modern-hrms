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

export async function login(input: LoginInput) {
  const response = await api.post<LoginResponse>(
    "/auth/login",
    input,
  );

  return response.data;
}