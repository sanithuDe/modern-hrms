import { api } from "../lib/api";

export type LeaveRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export interface LeaveType {
  id: string;
  name: string;
  description: string | null;
  defaultDays: number;
  isActive: boolean;

  _count?: {
    leaveBalances: number;
    leaveRequests: number;
  };

  createdAt: string;
  updatedAt: string;
}

export interface LeaveEmployee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;

  department: {
    id: string;
    name: string;
  } | null;

  position: {
    id: string;
    title: string;
  } | null;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;

  allocatedDays: string | number;
  usedDays: string | number;

  employee: LeaveEmployee;
  leaveType: LeaveType;

  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;

  startDate: string;
  endDate: string;
  totalDays: string | number;
  reason: string;

  status: LeaveRequestStatus;

  reviewComment: string | null;
  reviewedAt: string | null;
  cancelledAt: string | null;

  employee: LeaveEmployee;
  leaveType: LeaveType;

  reviewedBy: {
    id: string;
    email: string;
    role: string;
  } | null;

  createdAt: string;
  updatedAt: string;
}

export interface CreateLeaveTypeInput {
  name: string;
  description?: string;
  defaultDays: number;
  isActive?: boolean;
}

export interface UpdateLeaveTypeInput {
  name?: string;
  description?: string | null;
  defaultDays?: number;
  isActive?: boolean;
}

export interface CreateLeaveBalanceInput {
  employeeId: string;
  leaveTypeId: string;
  year: number;
  allocatedDays: number;
}

export interface UpdateLeaveBalanceInput {
  allocatedDays?: number;
  usedDays?: number;
}

export interface CreateLeaveRequestInput {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface ReviewLeaveRequestInput {
  decision: "APPROVED" | "REJECTED";
  reviewComment?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export async function getLeaveTypes(
  activeOnly = false,
): Promise<LeaveType[]> {
  const response = await api.get<
    ApiResponse<LeaveType[]>
  >("/leave/types", {
    params: {
      activeOnly,
    },
  });

  return response.data.data;
}

export async function createLeaveType(
  input: CreateLeaveTypeInput,
): Promise<LeaveType> {
  const response = await api.post<
    ApiResponse<LeaveType>
  >("/leave/types", input);

  return response.data.data;
}

export async function updateLeaveType(
  id: string,
  input: UpdateLeaveTypeInput,
): Promise<LeaveType> {
  const response = await api.patch<
    ApiResponse<LeaveType>
  >(`/leave/types/${id}`, input);

  return response.data.data;
}

export async function getLeaveBalances(): Promise<
  LeaveBalance[]
> {
  const response = await api.get<
    ApiResponse<LeaveBalance[]>
  >("/leave/balances");

  return response.data.data;
}

export async function getMyLeaveBalances(): Promise<
  LeaveBalance[]
> {
  const response = await api.get<
    ApiResponse<LeaveBalance[]>
  >("/leave/balances/my");

  return response.data.data;
}

export async function createLeaveBalance(
  input: CreateLeaveBalanceInput,
): Promise<LeaveBalance> {
  const response = await api.post<
    ApiResponse<LeaveBalance>
  >("/leave/balances", input);

  return response.data.data;
}

export async function updateLeaveBalance(
  id: string,
  input: UpdateLeaveBalanceInput,
): Promise<LeaveBalance> {
  const response = await api.patch<
    ApiResponse<LeaveBalance>
  >(`/leave/balances/${id}`, input);

  return response.data.data;
}

export async function getLeaveRequests(): Promise<
  LeaveRequest[]
> {
  const response = await api.get<
    ApiResponse<LeaveRequest[]>
  >("/leave/requests");

  return response.data.data;
}

export async function getMyLeaveRequests(): Promise<
  LeaveRequest[]
> {
  const response = await api.get<
    ApiResponse<LeaveRequest[]>
  >("/leave/requests/my");

  return response.data.data;
}

export async function createLeaveRequest(
  input: CreateLeaveRequestInput,
): Promise<LeaveRequest> {
  const response = await api.post<
    ApiResponse<LeaveRequest>
  >("/leave/requests", input);

  return response.data.data;
}

export async function reviewLeaveRequest(
  id: string,
  input: ReviewLeaveRequestInput,
): Promise<LeaveRequest> {
  const response = await api.patch<
    ApiResponse<LeaveRequest>
  >(`/leave/requests/${id}/review`, input);

  return response.data.data;
}

export async function cancelLeaveRequest(
  id: string,
): Promise<LeaveRequest> {
  const response = await api.patch<
    ApiResponse<LeaveRequest>
  >(`/leave/requests/${id}/cancel`);

  return response.data.data;
}