import { z } from "zod";

const departmentNameSchema = z
  .string()
  .trim()
  .min(
    2,
    "Department name must contain at least 2 characters",
  )
  .max(
    100,
    "Department name cannot exceed 100 characters",
  );

const departmentDescriptionSchema = z
  .string()
  .trim()
  .max(
    500,
    "Description cannot exceed 500 characters",
  );

export const departmentIdSchema = z.object({
  params: z.object({
    id: z
      .string()
      .uuid("Invalid department ID"),
  }),
});

export const createDepartmentSchema =
  z.object({
    body: z.object({
      name: departmentNameSchema,

      description:
        departmentDescriptionSchema.optional(),
    }),
  });

export const updateDepartmentSchema =
  z.object({
    params: z.object({
      id: z
        .string()
        .uuid("Invalid department ID"),
    }),

    body: z
      .object({
        name:
          departmentNameSchema.optional(),

        description:
          departmentDescriptionSchema
            .nullable()
            .optional(),
      })
      .refine(
        (data) =>
          data.name !== undefined ||
          data.description !== undefined,
        {
          message:
            "At least one field must be provided",
        },
      ),
  });

export type CreateDepartmentInput =
  z.infer<
    typeof createDepartmentSchema
  >["body"];

export type UpdateDepartmentInput =
  z.infer<
    typeof updateDepartmentSchema
  >["body"];