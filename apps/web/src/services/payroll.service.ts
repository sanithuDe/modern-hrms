import { api } from "../lib/api";

export type PayrollStatus =
  | "DRAFT"
  | "APPROVED"
  | "PAID"
  | "CANCELLED";

export interface PayrollEmployee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;

  department?: {
    id: string;
    name: string;
  } | null;

  position?: {
    id: string;
    title: string;
  } | null;
}

export interface SalaryProfile {
  id: string;
  employeeId: string;

  basicSalary: string | number;
  fixedAllowance: string | number;
  fixedDeduction: string | number;

  employee: PayrollEmployee | null;

  createdAt: string;
  updatedAt: string;
}

export interface Payroll {
  id: string;
  employeeId: string;

  year: number;
  month: number;

  basicSalary: string | number;
  allowances: string | number;
  deductions: string | number;
  grossSalary: string | number;
  netSalary: string | number;

  status: PayrollStatus;

  approvedAt: string | null;
  paidAt: string | null;

  createdAt: string;
  updatedAt: string;

  employee: PayrollEmployee | null;
}

export interface CreateSalaryProfileInput {
  employeeId: string;
  basicSalary: number;
  fixedAllowance?: number;
  fixedDeduction?: number;
}

export interface UpdateSalaryProfileInput {
  basicSalary?: number;
  fixedAllowance?: number;
  fixedDeduction?: number;
}

export interface GeneratePayrollInput {
  employeeId: string;
  year: number;
  month: number;
  additionalAllowance?: number;
  additionalDeduction?: number;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export async function getSalaryProfiles(): Promise<
  SalaryProfile[]
> {
  const response = await api.get<
    ApiResponse<SalaryProfile[]>
  >("/payroll/salary-profiles");

  return response.data.data;
}

export async function createSalaryProfile(
  input: CreateSalaryProfileInput,
): Promise<SalaryProfile> {
  const response = await api.post<
    ApiResponse<SalaryProfile>
  >("/payroll/salary-profiles", input);

  return response.data.data;
}

export async function updateSalaryProfile(
  employeeId: string,
  input: UpdateSalaryProfileInput,
): Promise<SalaryProfile> {
  const response = await api.patch<
    ApiResponse<SalaryProfile>
  >(
    `/payroll/salary-profiles/${employeeId}`,
    input,
  );

  return response.data.data;
}

export async function getPayrolls(): Promise<
  Payroll[]
> {
  const response = await api.get<
    ApiResponse<Payroll[]>
  >("/payroll");

  return response.data.data;
}

export async function generatePayroll(
  input: GeneratePayrollInput,
): Promise<Payroll> {
  const response = await api.post<
    ApiResponse<Payroll>
  >("/payroll/generate", input);

  return response.data.data;
}

export async function approvePayroll(
  payrollId: string,
): Promise<Payroll> {
  const response = await api.patch<
    ApiResponse<Payroll>
  >(`/payroll/${payrollId}/approve`);

  return response.data.data;
}

export async function markPayrollPaid(
  payrollId: string,
): Promise<Payroll> {
  const response = await api.patch<
    ApiResponse<Payroll>
  >(`/payroll/${payrollId}/paid`);

  return response.data.data;
}