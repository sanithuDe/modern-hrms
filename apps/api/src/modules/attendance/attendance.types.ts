import type {
  AttendanceMethod,
  AttendanceStatus,
} from "../../generated/prisma/client.js";

export interface CheckInInput {
  method?: AttendanceMethod;
  notes?: string;
}

export interface CheckOutInput {
  notes?: string;
}

export interface AttendanceQuery {
  employeeId?: string;
  status?: AttendanceStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  page: number;
  limit: number;
}

export interface ManualAttendanceInput {
  employeeId: string;
  date: Date;
  checkIn?: Date | null;
  checkOut?: Date | null;
  status: AttendanceStatus;
  notes?: string | null;
}

export interface UpdateAttendanceInput {
  checkIn?: Date | null;
  checkOut?: Date | null;
  status?: AttendanceStatus;
  notes?: string | null;
}