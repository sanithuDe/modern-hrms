import { api } from "../lib/api";

export type UserRole =
  | "SUPER_ADMIN"
  | "HR_MANAGER"
  | "EMPLOYEE";

export type UserStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "INACTIVE";

export interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  hireDate: string;
  createdAt: string;
  updatedAt: string;

  departmentId: string | null;
  positionId: string | null;

  department: {
    id: string;
    name: string;
  } | null;

  position: {
    id: string;
    title: string;
  } | null;

  user: {
    id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
  };
}

export interface CreateEmployeeInput {
  email: string;
  password: string;
  role: UserRole;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  phone?: string;
  hireDate: string;
  departmentId?: string | null;
  positionId?: string | null;
  departmentName?: string | null;
  positionTitle?: string | null;
}

export interface UpdateEmployeeInput {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  hireDate?: string;
  departmentId?: string | null;
  positionId?: string | null;
  departmentName?: string | null;
  positionTitle?: string | null;
  role?: UserRole;
}

interface EmployeesResponse {
  success: boolean;
  message: string;
  data: Employee[];
}

interface EmployeeResponse {
  success: boolean;
  message: string;
  data: Employee;
}

export async function getEmployees(): Promise<Employee[]> {
  const response =
    await api.get<EmployeesResponse>(
      "/employees",
    );

  return response.data.data;
}

export async function createEmployee(
  payload: CreateEmployeeInput,
): Promise<Employee> {
  const response =
    await api.post<EmployeeResponse>(
      "/employees",
      payload,
    );

  return response.data.data;
}

export async function getEmployeeById(
  id: string,
): Promise<Employee> {
  const response =
    await api.get<EmployeeResponse>(
      `/employees/${id}`,
    );

  return response.data.data;
}

export async function updateEmployee(
  id: string,
  payload: UpdateEmployeeInput,
): Promise<Employee> {
  const response =
    await api.patch<EmployeeResponse>(
      `/employees/${id}`,
      payload,
    );

  return response.data.data;
}

export async function updateEmployeeStatus(
  id: string,
  status: UserStatus,
): Promise<Employee> {
  const response =
    await api.patch<EmployeeResponse>(
      `/employees/${id}/status`,
      {
        status,
      },
    );

  return response.data.data;
}

export async function deleteEmployee(
  id: string,
): Promise<void> {
  await api.delete(`/employees/${id}`);
}