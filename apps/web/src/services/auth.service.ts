import {
  api,
} from "../lib/api";

export type UserRole =
  | "SUPER_ADMIN"
  | "HR_MANAGER"
  | "EMPLOYEE";

export type UserStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED";

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthEmployee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  hireDate: string | null;
  isActive: boolean;

  department?: {
    id: string;
    name: string;
  } | null;

  position?: {
    id: string;
    title: string;
  } | null;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  employee:
    | AuthEmployee
    | null;
}

export interface LoginResponse {
  success: boolean;
  message: string;

  data: {
    accessToken: string;
    user: AuthUser;
  };
}

export async function login(
  input: LoginInput,
) {
  const response =
    await api.post<LoginResponse>(
      "/auth/login",
      {
        email:
          input.email
            .trim()
            .toLowerCase(),

        password:
          input.password,
      },
    );

  return response.data;
}