import { api } from "../lib/api";

export type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "LATE"
  | "GRACE_LATE"
  | "SHORT_LEAVE"
  | "EARLY_DEPARTURE"
  | "HALF_DAY"
  | "FULL_DAY_LEAVE"
  | "ON_LEAVE"
  | "HOLIDAY";

export type AttendanceMethod =
  | "WEB"
  | "MOBILE"
  | "FINGERPRINT"
  | "MANUAL";

export interface AttendanceShift {
  id: string;
  name: string;
  code: string;

  startTimeMinutes: number;
  endTimeMinutes: number;

  crossesMidnight: boolean;

  graceMinutes: number;
  requiredWorkMinutes: number;

  isActive: boolean;
}

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
  employee?: AttendanceEmployee;

  shiftId: string | null;
  shift: AttendanceShift | null;

  date: string;

  scheduledStart: string | null;
  scheduledEnd: string | null;

  checkIn: string | null;
  checkOut: string | null;

  status: AttendanceStatus;
  method: AttendanceMethod;

  workingMinutes: number;
  lateMinutes: number;
  overtimeMinutes: number;
  earlyLeaveMinutes: number;
  shortLeaveMinutes: number;

  leaveDayValue: string | number;

  notes: string | null;

  createdById: string | null;
  updatedById: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface AttendancePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AttendanceList {
  records: Attendance[];
  pagination: AttendancePagination;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: AttendancePagination;
}

function normalizeAttendanceList(
  data: Attendance[] | AttendanceList | null | undefined,
  pagination?: AttendancePagination,
): AttendanceList {
  if (Array.isArray(data)) {
    return {
      records: data,
      pagination: pagination ?? {
        page: 1,
        limit: data.length,
        total: data.length,
        totalPages: 1,
      },
    };
  }

  return {
    records: data?.records ?? [],
    pagination:
      data?.pagination ??
      pagination ?? {
        page: 1,
        limit: 0,
        total: 0,
        totalPages: 0,
      },
  };
}

export async function checkIn(
  method: Exclude<
    AttendanceMethod,
    "MANUAL"
  > = "WEB",
  notes?: string,
): Promise<Attendance> {
  const response = await api.post<
    ApiResponse<Attendance>
  >("/attendance/check-in", {
    method,
    ...(notes ? { notes } : {}),
  });

  return response.data.data;
}

export async function checkOut(
  notes?: string,
): Promise<Attendance> {
  const response = await api.post<
    ApiResponse<Attendance>
  >("/attendance/check-out", {
    ...(notes ? { notes } : {}),
  });

  return response.data.data;
}

export async function getTodayAttendance(): Promise<
  Attendance | null
> {
  const response = await api.get<
    ApiResponse<Attendance | null>
  >("/attendance/my/today");

  return response.data.data;
}

export interface AttendanceFilters {
  status?: AttendanceStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getMyAttendance(
  params?: AttendanceFilters,
): Promise<AttendanceList> {
  const response = await api.get<
    ApiResponse<Attendance[] | AttendanceList>
  >("/attendance/my", {
    params,
  });

  return normalizeAttendanceList(
    response.data.data,
    response.data.pagination,
  );
}

export async function getAllAttendance(
  params?: {
    employeeId?: string;
    status?: AttendanceStatus;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  },
): Promise<AttendanceList> {
  const response = await api.get<
    ApiResponse<Attendance[] | AttendanceList>
  >("/attendance", {
    params,
  });

  return normalizeAttendanceList(
    response.data.data,
    response.data.pagination,
  );
}

export async function createManualAttendance(
  input: {
    employeeId: string;
    shiftId?: string | null;
    date: string;
    checkIn?: string | null;
    checkOut?: string | null;
    status: AttendanceStatus;
    notes?: string | null;
  },
): Promise<Attendance> {
  const response = await api.post<
    ApiResponse<Attendance>
  >("/attendance/manual", input);

  return response.data.data;
}

export async function updateAttendance(
  attendanceId: string,
  input: {
    checkIn?: string | null;
    checkOut?: string | null;
    status?: AttendanceStatus;
    notes?: string | null;
  },
): Promise<Attendance> {
  const response = await api.patch<
    ApiResponse<Attendance>
  >(
    `/attendance/${attendanceId}`,
    input,
  );

  return response.data.data;
}

export async function deleteAttendance(
  attendanceId: string,
): Promise<void> {
  await api.delete(
    `/attendance/${attendanceId}`,
  );
}