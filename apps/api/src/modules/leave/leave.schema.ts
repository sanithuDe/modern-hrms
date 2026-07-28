import { z } from "zod";

const idSchema = z
  .string()
  .trim()
  .min(1, "ID is required");

export const createLeaveTypeSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(
        2,
        "Leave type name must contain at least 2 characters",
      )
      .max(
        100,
        "Leave type name is too long",
      ),

    description: z
      .string()
      .trim()
      .max(
        500,
        "Description is too long",
      )
      .optional(),

    defaultDays: z
      .number()
      .nonnegative(
        "Default days cannot be negative",
      ),

    isActive: z.boolean().optional(),
  }),
});

export const updateLeaveTypeSchema = z.object({
  params: z.object({
    id: idSchema,
  }),

  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2)
        .max(100)
        .optional(),

      description: z
        .string()
        .trim()
        .max(500)
        .nullable()
        .optional(),

      defaultDays: z
        .number()
        .nonnegative()
        .optional(),

      isActive: z.boolean().optional(),
    })
    .refine(
      (body) =>
        body.name !== undefined ||
        body.description !== undefined ||
        body.defaultDays !== undefined ||
        body.isActive !== undefined,
      {
        message:
          "At least one leave type field is required",
      },
    ),
});

export const createLeaveBalanceSchema = z.object({
  body: z.object({
    employeeId: idSchema,
    leaveTypeId: idSchema,

    year: z
      .number()
      .int()
      .min(2000)
      .max(2100),

    allocatedDays: z
      .number()
      .nonnegative(
        "Allocated days cannot be negative",
      ),
  }),
});

export const updateLeaveBalanceSchema = z.object({
  params: z.object({
    id: idSchema,
  }),

  body: z
    .object({
      allocatedDays: z
        .number()
        .nonnegative(
          "Allocated days cannot be negative",
        )
        .optional(),

      usedDays: z
        .number()
        .nonnegative(
          "Used days cannot be negative",
        )
        .optional(),
    })
    .refine(
      (body) =>
        body.allocatedDays !== undefined ||
        body.usedDays !== undefined,
      {
        message:
          "At least one leave balance field is required",
      },
    ),
});

export const createLeaveRequestSchema = z.object({
  body: z
    .object({
      leaveTypeId: idSchema,

      startDate: z
        .string()
        .datetime({
          offset: true,
          message:
            "Start date must be a valid ISO date",
        }),

      endDate: z
        .string()
        .datetime({
          offset: true,
          message:
            "End date must be a valid ISO date",
        }),

      reason: z
        .string()
        .trim()
        .min(
          3,
          "Reason must contain at least 3 characters",
        )
        .max(
          1000,
          "Reason is too long",
        ),
    })
    .refine(
      (body) =>
        new Date(body.endDate) >=
        new Date(body.startDate),
      {
        message:
          "End date cannot be before start date",
        path: ["endDate"],
      },
    ),
});

export const reviewLeaveRequestSchema = z.object({
  params: z.object({
    id: idSchema,
  }),

  body: z.object({
    decision: z.enum([
      "APPROVED",
      "REJECTED",
    ]),

    reviewComment: z
      .string()
      .trim()
      .max(
        1000,
        "Review comment is too long",
      )
      .optional(),
  }),
});

export const leaveIdSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

export type CreateLeaveTypeInput =
  z.infer<
    typeof createLeaveTypeSchema
  >["body"];

export type UpdateLeaveTypeInput =
  z.infer<
    typeof updateLeaveTypeSchema
  >["body"];

export type CreateLeaveBalanceInput =
  z.infer<
    typeof createLeaveBalanceSchema
  >["body"];

export type UpdateLeaveBalanceInput =
  z.infer<
    typeof updateLeaveBalanceSchema
  >["body"];

export type CreateLeaveRequestInput =
  z.infer<
    typeof createLeaveRequestSchema
  >["body"];

export type ReviewLeaveRequestInput =
  z.infer<
    typeof reviewLeaveRequestSchema
  >["body"];