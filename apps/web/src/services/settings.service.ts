import { api } from "../lib/api";

export interface AttendanceSettings {
  id: string;

  officeStartTime: string;
  officeEndTime: string;

  gracePeriodMinutes: number;
  halfDayMinutes: number;
  fullDayMinutes: number;

  allowWebCheckIn: boolean;
  allowMobileCheckIn: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface UpdateAttendanceSettingsInput {
  officeStartTime: string;
  officeEndTime: string;

  gracePeriodMinutes: number;
  halfDayMinutes: number;
  fullDayMinutes: number;

  allowWebCheckIn: boolean;
  allowMobileCheckIn: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function getAttendanceSettings(): Promise<
  AttendanceSettings
> {
  const response =
    await api.get<
      ApiResponse<AttendanceSettings>
    >("/settings/attendance");

  return response.data.data;
}

export async function updateAttendanceSettings(
  input: UpdateAttendanceSettingsInput,
): Promise<AttendanceSettings> {
  const response =
    await api.patch<
      ApiResponse<AttendanceSettings>
    >(
      "/settings/attendance",
      input,
    );

  return response.data.data;
}

export async function resetAttendanceSettings(): Promise<
  AttendanceSettings
> {
  const response =
    await api.post<
      ApiResponse<AttendanceSettings>
    >(
      "/settings/attendance/reset",
    );

  return response.data.data;
}