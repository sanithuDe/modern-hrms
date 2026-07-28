import { z } from "zod";

const timeSchema = z
  .string()
  .trim()
  .regex(
    /^([01]\d|2[0-3]):([0-5]\d)$/,
    "Time must use HH:mm format",
  );

export const updateAttendanceSettingsSchema =
  z.object({
    body: z
      .object({
        officeStartTime:
          timeSchema,

        officeEndTime:
          timeSchema,

        gracePeriodMinutes: z
          .number()
          .int(
            "Grace period must be a whole number",
          )
          .min(
            0,
            "Grace period cannot be negative",
          )
          .max(
            240,
            "Grace period cannot exceed 240 minutes",
          ),

        halfDayMinutes: z
          .number()
          .int(
            "Half-day minutes must be a whole number",
          )
          .min(
            1,
            "Half-day minutes must be greater than zero",
          )
          .max(
            1440,
            "Half-day minutes cannot exceed 1440",
          ),

        fullDayMinutes: z
          .number()
          .int(
            "Full-day minutes must be a whole number",
          )
          .min(
            1,
            "Full-day minutes must be greater than zero",
          )
          .max(
            1440,
            "Full-day minutes cannot exceed 1440",
          ),

        allowWebCheckIn:
          z.boolean(),

        allowMobileCheckIn:
          z.boolean(),
      })
      .superRefine(
        (
          settings,
          context,
        ) => {
          if (
            settings.fullDayMinutes <=
            settings.halfDayMinutes
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode.custom,

              path: [
                "fullDayMinutes",
              ],

              message:
                "Full-day minutes must be greater than half-day minutes",
            });
          }

          const [
            startHour = "0",
            startMinute = "0",
          ] =
            settings.officeStartTime.split(
              ":",
            );

          const [
            endHour = "0",
            endMinute = "0",
          ] =
            settings.officeEndTime.split(
              ":",
            );

          const startMinutes =
            Number(startHour) *
              60 +
            Number(startMinute);

          const endMinutes =
            Number(endHour) *
              60 +
            Number(endMinute);

          if (
            endMinutes <=
            startMinutes
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode.custom,

              path: [
                "officeEndTime",
              ],

              message:
                "Office end time must be after office start time",
            });
          }
        },
      ),
  });

export type UpdateAttendanceSettingsInput =
  z.infer<
    typeof updateAttendanceSettingsSchema
  >["body"];