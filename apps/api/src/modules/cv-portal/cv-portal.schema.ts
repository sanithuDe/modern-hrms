import { z } from "zod";

export const cvPortalIdSchema =
  z.object({
    params: z.object({
      id: z
        .string()
        .trim()
        .min(
          1,
          "Submission ID is required",
        ),
    }),
  });

export const createMyCvSubmissionSchema =
  z.object({
    body: z.object({
      jobOpeningId: z
        .string()
        .trim()
        .min(
          1,
          "Job opening is required",
        ),

      phone: z
        .string()
        .trim()
        .max(
          50,
          "Phone number is too long",
        )
        .optional()
        .or(
          z.literal(""),
        ),

      currentJobTitle: z
        .string()
        .trim()
        .max(
          150,
          "Current job title is too long",
        )
        .optional()
        .or(
          z.literal(""),
        ),

      currentCompany: z
        .string()
        .trim()
        .max(
          150,
          "Current company is too long",
        )
        .optional()
        .or(
          z.literal(""),
        ),

      yearsOfExperience: z
        .coerce
        .number()
        .min(
          0,
          "Experience cannot be negative",
        )
        .max(
          100,
          "Experience is too large",
        )
        .default(0),

      linkedInUrl: z
        .string()
        .trim()
        .max(
          1000,
          "LinkedIn URL is too long",
        )
        .optional()
        .or(
          z.literal(""),
        ),

      portfolioUrl: z
        .string()
        .trim()
        .max(
          1000,
          "Portfolio URL is too long",
        )
        .optional()
        .or(
          z.literal(""),
        ),

      notes: z
        .string()
        .trim()
        .max(
          5000,
          "Notes cannot exceed 5000 characters",
        )
        .optional()
        .or(
          z.literal(""),
        ),
    }),
  });

export type CreateMyCvSubmissionInput =
  z.infer<
    typeof createMyCvSubmissionSchema
  >["body"];