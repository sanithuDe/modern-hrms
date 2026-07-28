import { api } from "../lib/api";

export type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "LATE"
  | "HALF_DAY"
  | "ON_LEAVE"
  | "HOLIDAY";

export type AttendanceMethod =
  | "WEB"
  | "MOBILE"
  | "FINGERPRINT"
  | "MANUAL";

export interface AttendanceEmployee {
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

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;

  checkIn: string | null;
  checkOut: string | null;

  status: AttendanceStatus;
  method: AttendanceMethod;

  workingMinutes: number;
  lateMinutes: number;
  overtimeMinutes: number;

  notes: string | null;

  employee?: AttendanceEmployee;

  createdAt: string;
  updatedAt: string;
}

export interface AttendanceFilters {
  employeeId?: string;
  status?: AttendanceStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedAttendanceResponse {
  success: boolean;
  data: Attendance[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function checkIn(
  notes?: string,
): Promise<Attendance> {
  const response = await api.post("/attendance/check-in", {
    method: "WEB",
    notes,
  });

  return response.data.data;
}

export async function checkOut(
  notes?: string,
): Promise<Attendance> {
  const response = await api.post("/attendance/check-out", {
    notes,
  });

  return response.data.data;
}

export async function getTodayAttendance(): Promise<
  Attendance | null
> {
  const response = await api.get("/attendance/my/today");

  return response.data.data;
}

export async function getMyAttendance(
  filters: AttendanceFilters = {},
): Promise<PaginatedAttendanceResponse> {
  const response = await api.get("/attendance/my", {
    params: filters,
  });

  return response.data;
}

export async function getAllAttendance(
  filters: AttendanceFilters = {},
): Promise<PaginatedAttendanceResponse> {
  const response = await api.get("/attendance", {
    params: filters,
  });

  return response.data;
}

export async function createManualAttendance(input: {
  employeeId: string;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status: AttendanceStatus;
  notes?: string | null;
}): Promise<Attendance> {
  const response = await api.post(
    "/attendance/manual",
    input,
  );

  return response.data.data;
}

export async function updateAttendance(
  id: string,
  input: {
    checkIn?: string | null;
    checkOut?: string | null;
    status?: AttendanceStatus;
    notes?: string | null;
  },
): Promise<Attendance> {
  const response = await api.patch(
    `/attendance/${id}`,
    input,
  );

  return response.data.data;
}

export async function deleteAttendance(
  id: string,
): Promise<void> {
  await api.delete(`/attendance/${id}`);
}