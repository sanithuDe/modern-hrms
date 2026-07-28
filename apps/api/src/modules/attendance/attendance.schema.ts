import { z } from "zod";

export const attendanceStatusSchema = z.enum([
  "PRESENT",
  "ABSENT",
  "LATE",
  "HALF_DAY",
  "ON_LEAVE",
  "HOLIDAY",
]);

export const attendanceMethodSchema = z.enum([
  "WEB",
  "MOBILE",
  "FINGERPRINT",
  "MANUAL",
]);

export const checkInSchema = z.object({
  method: z
    .enum(["WEB", "MOBILE", "FINGERPRINT"])
    .default("WEB"),

  notes: z
    .string()
    .trim()
    .max(500)
    .optional(),
});

export const checkOutSchema = z.object({
  notes: z
    .string()
    .trim()
    .max(500)
    .optional(),
});

export const attendanceQuerySchema = z.object({
  employeeId: z
    .string()
    .trim()
    .min(1)
    .optional(),

  status: attendanceStatusSchema.optional(),

  startDate: z
    .string()
    .trim()
    .optional(),

  endDate: z
    .string()
    .trim()
    .optional(),

  search: z
    .string()
    .trim()
    .optional(),

  page: z.coerce
    .number()
    .int()
    .positive()
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(20),
});

export const manualAttendanceSchema = z
  .object({
    employeeId: z.string().trim().min(1),

    date: z.coerce.date(),

    checkIn: z.coerce
      .date()
      .nullable()
      .optional(),

    checkOut: z.coerce
      .date()
      .nullable()
      .optional(),

    status: attendanceStatusSchema,

    notes: z
      .string()
      .trim()
      .max(500)
      .nullable()
      .optional(),
  })
  .refine(
    (value) => {
      if (!value.checkIn || !value.checkOut) {
        return true;
      }

      return value.checkOut > value.checkIn;
    },
    {
      message:
        "Check-out time must be after check-in time",
      path: ["checkOut"],
    },
  );

export const updateAttendanceSchema = z
  .object({
    checkIn: z.coerce
      .date()
      .nullable()
      .optional(),

    checkOut: z.coerce
      .date()
      .nullable()
      .optional(),

    status: attendanceStatusSchema.optional(),

    notes: z
      .string()
      .trim()
      .max(500)
      .nullable()
      .optional(),
  })
  .refine(
    (value) => {
      if (!value.checkIn || !value.checkOut) {
        return true;
      }

      return value.checkOut > value.checkIn;
    },
    {
      message:
        "Check-out time must be after check-in time",
      path: ["checkOut"],
    },
  );