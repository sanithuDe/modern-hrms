import { z } from "zod";

export const createEmployeeSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Enter a valid email address"),

    password: z
      .string()
      .min(8, "Password must contain at least 8 characters"),

    role: z.enum(["HR_MANAGER", "EMPLOYEE"]),

    employeeNumber: z
      .string()
      .trim()
      .min(2, "Employee number is required")
      .max(30, "Employee number cannot exceed 30 characters"),

    firstName: z
      .string()
      .trim()
      .min(2, "First name must contain at least 2 characters")
      .max(100),

    lastName: z
      .string()
      .trim()
      .min(2, "Last name must contain at least 2 characters")
      .max(100),

    phone: z.string().trim().max(30).optional(),

    hireDate: z.coerce.date(),

    departmentId: z.string().uuid().nullable().optional(),

    positionId: z.string().uuid().nullable().optional(),
  }),
});

export const updateEmployeeSchema = z.object({
  body: z
    .object({
      firstName: z.string().trim().min(2).max(100).optional(),
      lastName: z.string().trim().min(2).max(100).optional(),
      phone: z.string().trim().max(30).nullable().optional(),
      hireDate: z.coerce.date().optional(),
      departmentId: z.string().uuid().nullable().optional(),
      positionId: z.string().uuid().nullable().optional(),
    })
    .refine(
      (data) => Object.values(data).some((value) => value !== undefined),
      {
        message: "At least one field must be provided",
      },
    ),
});

export const updateEmployeeStatusSchema = z.object({
  body: z.object({
    status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
  }),
});

export const employeeIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid employee ID"),
  }),
});

export type CreateEmployeeInput =
  z.infer<typeof createEmployeeSchema>["body"];

export type UpdateEmployeeInput =
  z.infer<typeof updateEmployeeSchema>["body"];

export type UpdateEmployeeStatusInput =
  z.infer<typeof updateEmployeeStatusSchema>["body"];