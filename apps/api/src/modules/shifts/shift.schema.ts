import {
  z,
} from "zod";

const minutesSchema =
  z
    .number()
    .int()
    .min(0)
    .max(1439);

export const shiftIdParamsSchema =
  z.object({
    id: z
      .string()
      .trim()
      .min(
        1,
        "Shift ID is required",
      ),
  });

export const createShiftSchema =
  z.object({
    name: z
      .string()
      .trim()
      .min(
        2,
        "Shift name is required",
      )
      .max(100),

    code: z
      .string()
      .trim()
      .min(
        2,
        "Shift code is required",
      )
      .max(30),

    startTimeMinutes:
      minutesSchema,

    endTimeMinutes:
      minutesSchema,

    crossesMidnight:
      z.boolean(),

    graceMinutes:
      z
        .number()
        .int()
        .min(0)
        .max(240),

    requiredWorkMinutes:
      z
        .number()
        .int()
        .min(1)
        .max(1440),

    isActive:
      z.boolean().default(true),
  });

export const updateShiftSchema =
  z
    .object({
      name: z
        .string()
        .trim()
        .min(2)
        .max(100)
        .optional(),

      code: z
        .string()
        .trim()
        .min(2)
        .max(30)
        .optional(),

      startTimeMinutes:
        minutesSchema.optional(),

      endTimeMinutes:
        minutesSchema.optional(),

      crossesMidnight:
        z.boolean().optional(),

      graceMinutes:
        z
          .number()
          .int()
          .min(0)
          .max(240)
          .optional(),

      requiredWorkMinutes:
        z
          .number()
          .int()
          .min(1)
          .max(1440)
          .optional(),

      isActive:
        z.boolean().optional(),
    })
    .refine(
      (input) =>
        Object.keys(input).length > 0,
      {
        message:
          "At least one field is required",
      },
    );

export const assignShiftSchema =
  z
    .object({
      employeeId: z
        .string()
        .trim()
        .min(
          1,
          "Employee ID is required",
        ),

      shiftId: z
        .string()
        .trim()
        .min(
          1,
          "Shift ID is required",
        ),

      effectiveFrom: z
        .string()
        .datetime({
          offset: true,
        }),

      effectiveTo: z
        .string()
        .datetime({
          offset: true,
        })
        .nullable()
        .optional(),
    })
    .refine(
      (input) => {
        if (!input.effectiveTo) {
          return true;
        }

        return (
          new Date(
            input.effectiveTo,
          ).getTime() >=
          new Date(
            input.effectiveFrom,
          ).getTime()
        );
      },
      {
        message:
          "Effective end date must be after the start date",

        path: [
          "effectiveTo",
        ],
      },
    );

export const assignmentIdParamsSchema =
  z.object({
    id: z
      .string()
      .trim()
      .min(
        1,
        "Assignment ID is required",
      ),
  });

export const updateShiftAssignmentSchema =
  z
    .object({
      shiftId: z
        .string()
        .trim()
        .min(
          1,
          "Shift ID is required",
        )
        .optional(),

      effectiveFrom: z
        .string()
        .datetime({
          offset: true,
        })
        .optional(),

      effectiveTo: z
        .string()
        .datetime({
          offset: true,
        })
        .nullable()
        .optional(),

      isActive: z
        .boolean()
        .optional(),
    })
    .refine(
      (input) =>
        Object.keys(input).length > 0,
      {
        message:
          "At least one field is required",
      },
    );

export type CreateShiftInput =
  z.infer<
    typeof createShiftSchema
  >;

export type UpdateShiftInput =
  z.infer<
    typeof updateShiftSchema
  >;

export type AssignShiftInput =
  z.infer<
    typeof assignShiftSchema
  >;

export type UpdateShiftAssignmentInput =
  z.infer<
    typeof updateShiftAssignmentSchema
  >;