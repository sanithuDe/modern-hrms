import { z } from "zod";

const employmentTypeSchema = z.enum([
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERNSHIP",
  "TEMPORARY",
]);

const jobOpeningStatusSchema = z.enum([
  "DRAFT",
  "OPEN",
  "CLOSED",
  "CANCELLED",
]);

const candidateStageSchema = z.enum([
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFERED",
  "HIRED",
  "REJECTED",
  "WITHDRAWN",
]);

const optionalStringSchema = z
  .union([
    z.string().trim(),
    z.literal(""),
    z.null(),
  ])
  .optional();

const optionalPhoneSchema = z
  .union([
    z
      .string()
      .trim()
      .regex(
        /^\d{0,15}$/,
        "Phone number must contain digits only",
      )
      .max(15),
    z.literal(""),
    z.null(),
  ])
  .optional();

const optionalIdSchema = z
  .union([
    z.string().trim().min(1),
    z.literal(""),
    z.null(),
  ])
  .optional();

const optionalDateSchema = z
  .union([
    z
      .string()
      .trim()
      .refine(
        (value) =>
          !Number.isNaN(
            new Date(value).getTime(),
          ),
        {
          message: "Invalid date",
        },
      ),
    z.literal(""),
    z.null(),
  ])
  .optional();

const optionalMoneySchema = z
  .union([
    z
      .number()
      .nonnegative(
        "Salary cannot be negative",
      ),
    z.null(),
  ])
  .optional();

const jobOpeningFieldsSchema =
  z.object({
    title: z
      .string()
      .trim()
      .min(
        1,
        "Job title is required",
      )
      .max(
        150,
        "Job title cannot exceed 150 characters",
      ),

    description: z
      .string()
      .trim()
      .min(
        1,
        "Job description is required",
      )
      .max(
        10000,
        "Description cannot exceed 10000 characters",
      ),

    employmentType:
      employmentTypeSchema,

    numberOfVacancies: z
      .number()
      .int(
        "Number of vacancies must be a whole number",
      )
      .min(
        1,
        "At least one vacancy is required",
      )
      .max(
        1000,
        "Number of vacancies is too large",
      ),

    minimumExperience: z
      .number()
      .int(
        "Minimum experience must be a whole number",
      )
      .min(
        0,
        "Minimum experience cannot be negative",
      )
      .max(
        100,
        "Minimum experience is too large",
      ),

    requiredSkills:
      optionalStringSchema,

    responsibilities:
      optionalStringSchema,

    requirements:
      optionalStringSchema,

    salaryMin:
      optionalMoneySchema,

    salaryMax:
      optionalMoneySchema,

    location:
      optionalStringSchema,

    applicationDeadline:
      optionalDateSchema,

    departmentId:
      optionalIdSchema,

    positionId:
      optionalIdSchema,
  });

function validateSalaryRange(
  data: {
    salaryMin?: number | null;
    salaryMax?: number | null;
  },
  context: z.RefinementCtx,
): void {
  if (
    data.salaryMin === undefined ||
    data.salaryMin === null ||
    data.salaryMax === undefined ||
    data.salaryMax === null
  ) {
    return;
  }

  if (
    data.salaryMax <
    data.salaryMin
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["salaryMax"],
      message:
        "Maximum salary must be greater than or equal to minimum salary",
    });
  }
}

const createJobOpeningBodySchema =
  jobOpeningFieldsSchema
    .extend({
      employmentType:
        employmentTypeSchema.default(
          "FULL_TIME",
        ),

      numberOfVacancies: z
        .number()
        .int()
        .min(1)
        .default(1),

      minimumExperience: z
        .number()
        .int()
        .min(0)
        .default(0),
    })
    .superRefine(
      validateSalaryRange,
    );

const updateJobOpeningBodySchema =
  jobOpeningFieldsSchema
    .partial()
    .refine(
      (body) =>
        Object.keys(body).length >
        0,
      {
        message:
          "At least one field must be provided",
      },
    )
    .superRefine(
      validateSalaryRange,
    );

const candidateFieldsSchema =
  z.object({
    firstName: z
      .string()
      .trim()
      .min(
        1,
        "First name is required",
      )
      .max(
        100,
        "First name cannot exceed 100 characters",
      ),

    lastName: z
      .string()
      .trim()
      .min(
        1,
        "Last name is required",
      )
      .max(
        100,
        "Last name cannot exceed 100 characters",
      ),

    email: z
      .string()
      .trim()
      .email(
        "A valid email address is required",
      )
      .max(
        255,
        "Email cannot exceed 255 characters",
      ),

    phone:
      optionalPhoneSchema,

    currentJobTitle:
      optionalStringSchema,

    currentCompany:
      optionalStringSchema,

    yearsOfExperience: z
      .number()
      .min(
        0,
        "Experience cannot be negative",
      )
      .max(
        100,
        "Experience is too large",
      ),

    skills:
      optionalStringSchema,

    education:
      optionalStringSchema,

    address:
      optionalStringSchema,

    resumeFileName:
      optionalStringSchema,

    resumeUrl:
      optionalStringSchema,

    linkedInUrl:
      optionalStringSchema,

    portfolioUrl:
      optionalStringSchema,

    notes:
      optionalStringSchema,

    appliedAt:
      optionalDateSchema,

    jobOpeningId: z
      .string()
      .trim()
      .min(
        1,
        "Job opening is required",
      ),
  });

const createCandidateBodySchema =
  candidateFieldsSchema.extend({
    yearsOfExperience: z
      .number()
      .min(0)
      .default(0),
  });

const updateCandidateBodySchema =
  candidateFieldsSchema
    .partial()
    .refine(
      (body) =>
        Object.keys(body).length >
        0,
      {
        message:
          "At least one field must be provided",
      },
    );

export const recruitmentIdSchema =
  z.object({
    params: z.object({
      id: z
        .string()
        .trim()
        .min(
          1,
          "ID is required",
        ),
    }),
  });

export const createJobOpeningSchema =
  z.object({
    body:
      createJobOpeningBodySchema,
  });

export const updateJobOpeningSchema =
  z.object({
    params:
      recruitmentIdSchema.shape
        .params,

    body:
      updateJobOpeningBodySchema,
  });

export const updateJobStatusSchema =
  z.object({
    params:
      recruitmentIdSchema.shape
        .params,

    body: z.object({
      status:
        jobOpeningStatusSchema,
    }),
  });

export const createCandidateSchema =
  z.object({
    body:
      createCandidateBodySchema,
  });

export const updateCandidateSchema =
  z.object({
    params:
      recruitmentIdSchema.shape
        .params,

    body:
      updateCandidateBodySchema,
  });

export const updateCandidateStageSchema =
  z.object({
    params:
      recruitmentIdSchema.shape
        .params,

    body: z.object({
      stage:
        candidateStageSchema,
    }),
  });

export type CreateJobOpeningInput =
  z.infer<
    typeof createJobOpeningSchema
  >["body"];

export type UpdateJobOpeningInput =
  z.infer<
    typeof updateJobOpeningSchema
  >["body"];

export type UpdateJobStatusInput =
  z.infer<
    typeof updateJobStatusSchema
  >["body"];

export type CreateCandidateInput =
  z.infer<
    typeof createCandidateSchema
  >["body"];

export type UpdateCandidateInput =
  z.infer<
    typeof updateCandidateSchema
  >["body"];

export type UpdateCandidateStageInput =
  z.infer<
    typeof updateCandidateStageSchema
  >["body"];