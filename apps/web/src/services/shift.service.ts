import { api } from "../lib/api";

export interface Shift {
  id: string;
  name: string;
  code: string;
  startTimeMinutes: number;
  endTimeMinutes: number;
  crossesMidnight: boolean;
  graceMinutes: number;
  requiredWorkMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftAssignmentEmployee {
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

export interface ShiftAssignment {
  id: string;
  employeeId: string;
  shiftId: string;

  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;

  shift: Shift;
  employee: ShiftAssignmentEmployee;

  createdAt: string;
  updatedAt: string;
}

export interface AssignShiftInput {
  employeeId: string;
  shiftId: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function getShifts(): Promise<Shift[]> {
  const response = await api.get<
    ApiResponse<Shift[]>
  >("/shifts");

  return response.data.data;
}

export async function getMyShift(): Promise<
  ShiftAssignment | null
> {
  const response = await api.get<
    ApiResponse<ShiftAssignment | null>
  >("/shifts/my");

  return response.data.data;
}

export async function getShiftAssignments(): Promise<
  ShiftAssignment[]
> {
  const response = await api.get<
    ApiResponse<ShiftAssignment[]>
  >("/shifts/assignments");

  return response.data.data;
}

export async function assignShift(
  input: AssignShiftInput,
): Promise<ShiftAssignment> {
  const response = await api.post<
    ApiResponse<ShiftAssignment>
  >("/shifts/assignments", input);

  return response.data.data;
}