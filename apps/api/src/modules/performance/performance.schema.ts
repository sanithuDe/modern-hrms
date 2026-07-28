import { z } from "zod";

const performancePeriodSchema =
  z.enum([
    "MONTHLY",
    "QUARTERLY",
    "HALF_YEARLY",
    "YEARLY",
  ]);

const scoreSchema = z
  .number({
    message:
      "Score must be a number",
  })
  .int(
    "Score must be a whole number",
  )
  .min(
    0,
    "Score cannot be below 0",
  )
  .max(
    100,
    "Score cannot exceed 100",
  );

const optionalTextSchema = z
  .string()
  .trim()
  .max(
    2000,
    "Text cannot exceed 2000 characters",
  )
  .optional();

const performanceBodySchema =
  z.object({
    employeeId: z
      .string()
      .trim()
      .min(
        1,
        "Employee is required",
      ),

    title: z
      .string()
      .trim()
      .min(
        1,
        "Performance review title is required",
      )
      .max(
        150,
        "Title cannot exceed 150 characters",
      ),

    reviewDate: z
      .string()
      .trim()
      .min(
        1,
        "Review date is required",
      )
      .refine(
        (value) =>
          !Number.isNaN(
            new Date(
              value,
            ).getTime(),
          ),
        {
          message:
            "Invalid review date",
        },
      ),

    period:
      performancePeriodSchema,

    productivityScore:
      scoreSchema,

    qualityScore:
      scoreSchema,

    teamworkScore:
      scoreSchema,

    attendanceScore:
      scoreSchema,

    communicationScore:
      scoreSchema,

    strengths:
      optionalTextSchema,

    improvements:
      optionalTextSchema,

    reviewerComments:
      optionalTextSchema,
  });

export const createPerformanceSchema =
  z.object({
    body:
      performanceBodySchema,
  });

export const updatePerformanceSchema =
  z.object({
    params: z.object({
      id: z
        .string()
        .trim()
        .min(
          1,
          "Performance review ID is required",
        ),
    }),

    body:
      performanceBodySchema
        .partial()
        .refine(
          (body) =>
            Object.keys(
              body,
            ).length > 0,
          {
            message:
              "At least one field must be provided",
          },
        ),
  });

export const performanceIdSchema =
  z.object({
    params: z.object({
      id: z
        .string()
        .trim()
        .min(
          1,
          "Performance review ID is required",
        ),
    }),
  });

export const employeeCommentSchema =
  z.object({
    params: z.object({
      id: z
        .string()
        .trim()
        .min(
          1,
          "Performance review ID is required",
        ),
    }),

    body: z.object({
      employeeComments: z
        .string()
        .trim()
        .min(
          1,
          "Employee comment is required",
        )
        .max(
          2000,
          "Comment cannot exceed 2000 characters",
        ),
    }),
  });

export type CreatePerformanceInput =
  z.infer<
    typeof createPerformanceSchema
  >["body"];

export type UpdatePerformanceInput =
  z.infer<
    typeof updatePerformanceSchema
  >["body"];