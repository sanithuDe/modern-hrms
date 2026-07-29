import { z } from "zod";

export const updateAttendancePolicySchema =
  z
    .object({
      monthlyShortLeaveCount: z
        .number()
        .int(
          "Monthly short-leave count must be an integer",
        )
        .min(
          0,
          "Monthly short-leave count cannot be negative",
        )
        .max(
          31,
          "Monthly short-leave count cannot exceed 31",
        )
        .optional(),

      monthlyShortLeaveMinutes: z
        .number()
        .int(
          "Monthly short-leave minutes must be an integer",
        )
        .min(
          0,
          "Monthly short-leave minutes cannot be negative",
        )
        .max(
          1440,
          "Monthly short-leave minutes cannot exceed 1440",
        )
        .optional(),

      fullDayMinimumWorkMinutes: z
        .number()
        .int(
          "Full-day minimum work minutes must be an integer",
        )
        .min(
          0,
          "Full-day minimum work minutes cannot be negative",
        )
        .max(
          1440,
          "Full-day minimum work minutes cannot exceed 1440",
        )
        .optional(),

      halfDayMinimumWorkMinutes: z
        .number()
        .int(
          "Half-day minimum work minutes must be an integer",
        )
        .min(
          0,
          "Half-day minimum work minutes cannot be negative",
        )
        .max(
          1440,
          "Half-day minimum work minutes cannot exceed 1440",
        )
        .optional(),

      allowWebCheckIn: z
        .boolean()
        .optional(),

      allowMobileCheckIn: z
        .boolean()
        .optional(),
    })
    .refine(
      (input) =>
        Object.keys(input).length > 0,
      {
        message:
          "At least one attendance policy field must be provided",
      },
    );

export type UpdateAttendancePolicyInput =
  z.infer<
    typeof updateAttendancePolicySchema
  >;