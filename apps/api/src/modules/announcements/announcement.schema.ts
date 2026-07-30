import { z } from "zod";

const announcementAudienceSchema = z.enum([
  "ALL",
  "SUPER_ADMIN",
  "HR_MANAGER",
  "EMPLOYEE",
]);

const optionalDateSchema = z.preprocess(
  (value) => {
    if (value === undefined) return undefined;
    if (value === null || value === "") return null;
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? value : value.toISOString();
    }
    return value;
  },
  z
    .union([
      z
        .string()
        .trim()
        .refine(
          (value) => !Number.isNaN(new Date(value).getTime()),
          { message: "Invalid date" },
        ),
      z.null(),
    ])
    .optional(),
);

const booleanSchema = z.preprocess((value) => {
  if (value === "true" || value === "on" || value === 1 || value === "1") {
    return true;
  }

  if (value === "false" || value === "off" || value === 0 || value === "0") {
    return false;
  }

  return value;
}, z.boolean());

const announcementFieldsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Announcement title is required")
    .max(150, "Title cannot exceed 150 characters"),

  content: z
    .string()
    .trim()
    .min(1, "Announcement content is required")
    .max(5000, "Content cannot exceed 5000 characters"),

  audience: announcementAudienceSchema,

  isPinned: booleanSchema,

  publishAt: optionalDateSchema,

  expiresAt: optionalDateSchema,
});

function validateAnnouncementDates(
  data: {
    publishAt?: string | null;
    expiresAt?: string | null;
  },
  context: z.RefinementCtx,
): void {
  if (!data.publishAt || !data.expiresAt) {
    return;
  }

  const publishTime = new Date(data.publishAt).getTime();
  const expiryTime = new Date(data.expiresAt).getTime();

  if (Number.isNaN(publishTime) || Number.isNaN(expiryTime)) {
    return;
  }

  if (expiryTime <= publishTime) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["expiresAt"],
      message: "Expiry date must be after the publish date",
    });
  }
}

const createAnnouncementBodySchema = announcementFieldsSchema
  .extend({
    audience: announcementAudienceSchema.default("ALL"),
    isPinned: booleanSchema.default(false),
  })
  .superRefine(validateAnnouncementDates);

const updateAnnouncementBodySchema = announcementFieldsSchema
  .partial()
  .refine((body) => Object.keys(body).length > 0, {
    message: "At least one field must be provided",
  })
  .superRefine(validateAnnouncementDates);

export const createAnnouncementSchema = z.object({
  body: createAnnouncementBodySchema,
});

export const updateAnnouncementSchema = z.object({
  params: z.object({
    id: z
      .string()
      .trim()
      .min(1, "Announcement ID is required"),
  }),
  body: updateAnnouncementBodySchema,
});

export const announcementIdSchema = z.object({
  params: z.object({
    id: z
      .string()
      .trim()
      .min(1, "Announcement ID is required"),
  }),
});

export type CreateAnnouncementInput = z.infer<
  typeof createAnnouncementSchema
>["body"];

export type UpdateAnnouncementInput = z.infer<
  typeof updateAnnouncementSchema
>["body"];
