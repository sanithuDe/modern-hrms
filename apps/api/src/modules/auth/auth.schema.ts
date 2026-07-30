import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .email("Please enter a valid email address"),

    password: z
      .string()
      .min(8, "Password must contain at least 8 characters"),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .email("Please enter a valid email address"),
  }),
});

export const resetPasswordSchema = z.object({
  body: z
    .object({
      token: z
        .string()
        .trim()
        .min(20, "Reset token is invalid"),

      password: z
        .string()
        .min(8, "Password must contain at least 8 characters")
        .max(100, "Password is too long"),

      confirmPassword: z
        .string()
        .min(8, "Please confirm your password"),
    })
    .refine(
      (data) => data.password === data.confirmPassword,
      {
        message: "Passwords do not match",
        path: ["confirmPassword"],
      },
    ),
});

export type LoginInput = z.infer<typeof loginSchema>["body"];
export type ForgotPasswordInput = z.infer<
  typeof forgotPasswordSchema
>["body"];
export type ResetPasswordInput = z.infer<
  typeof resetPasswordSchema
>["body"];
