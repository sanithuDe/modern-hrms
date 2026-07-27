import { z } from "zod";

const positionBodySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Position title is required")
    .max(
      100,
      "Position title cannot exceed 100 characters",
    ),

  description: z
    .string()
    .trim()
    .max(
      500,
      "Description cannot exceed 500 characters",
    )
    .optional(),

  departmentId: z
    .string()
    .uuid("Invalid department ID")
    .nullable()
    .optional(),
});

export const createPositionSchema = z.object({
  body: positionBodySchema,
});

export const updatePositionSchema = z.object({
  params: z.object({
    id: z
      .string()
      .uuid("Invalid position ID"),
  }),

  body: positionBodySchema
    .partial()
    .refine(
      (body) =>
        body.title !== undefined ||
        body.description !== undefined ||
        body.departmentId !== undefined,
      {
        message:
          "At least one field must be provided",
      },
    ),
});

export const positionIdSchema = z.object({
  params: z.object({
    id: z
      .string()
      .uuid("Invalid position ID"),
  }),
});

export type CreatePositionInput =
  z.infer<
    typeof createPositionSchema
  >["body"];

export type UpdatePositionInput =
  z.infer<
    typeof updatePositionSchema
  >["body"];