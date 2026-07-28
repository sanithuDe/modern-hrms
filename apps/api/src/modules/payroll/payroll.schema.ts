import { z } from "zod";

const idSchema = z
  .string()
  .trim()
  .min(1, "ID is required");

export const createSalaryProfileSchema =
  z.object({
    body: z.object({
      employeeId: idSchema,

      basicSalary: z
        .number()
        .nonnegative(
          "Basic salary cannot be negative",
        ),

      fixedAllowance: z
        .number()
        .nonnegative(
          "Allowance cannot be negative",
        )
        .optional(),

      fixedDeduction: z
        .number()
        .nonnegative(
          "Deduction cannot be negative",
        )
        .optional(),
    }),
  });

export const updateSalaryProfileSchema =
  z.object({
    params: z.object({
      employeeId: idSchema,
    }),

    body: z
      .object({
        basicSalary: z
          .number()
          .nonnegative()
          .optional(),

        fixedAllowance: z
          .number()
          .nonnegative()
          .optional(),

        fixedDeduction: z
          .number()
          .nonnegative()
          .optional(),
      })
      .refine(
        (body) =>
          body.basicSalary !== undefined ||
          body.fixedAllowance !== undefined ||
          body.fixedDeduction !== undefined,
        {
          message:
            "At least one salary field is required",
        },
      ),
  });

export const generatePayrollSchema =
  z.object({
    body: z.object({
      employeeId: idSchema,

      year: z
        .number()
        .int()
        .min(2000)
        .max(2100),

      month: z
        .number()
        .int()
        .min(1)
        .max(12),

      additionalAllowance: z
        .number()
        .nonnegative()
        .optional(),

      additionalDeduction: z
        .number()
        .nonnegative()
        .optional(),
    }),
  });

export const payrollIdSchema =
  z.object({
    params: z.object({
      id: idSchema,
    }),
  });

export type CreateSalaryProfileInput =
  z.infer<
    typeof createSalaryProfileSchema
  >["body"];

export type UpdateSalaryProfileInput =
  z.infer<
    typeof updateSalaryProfileSchema
  >["body"];

export type GeneratePayrollInput =
  z.infer<
    typeof generatePayrollSchema
  >["body"];