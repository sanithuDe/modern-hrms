import { z } from "zod";

const announcementAudienceSchema =
  z.enum([
    "ALL",
    "SUPER_ADMIN",
    "HR_MANAGER",
    "EMPLOYEE",
  ]);

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

const announcementFieldsSchema =
  z.object({
    title: z
      .string()
      .trim()
      .min(
        1,
        "Announcement title is required",
      )
      .max(
        150,
        "Title cannot exceed 150 characters",
      ),

    content: z
      .string()
      .trim()
      .min(
        1,
        "Announcement content is required",
      )
      .max(
        5000,
        "Content cannot exceed 5000 characters",
      ),

    audience:
      announcementAudienceSchema,

    isPinned:
      z.boolean(),

    publishAt:
      optionalDateSchema,

    expiresAt:
      optionalDateSchema,
  });

function validateAnnouncementDates(
  data: {
    publishAt?:
      | string
      | null;

    expiresAt?:
      | string
      | null;
  },
  context: z.RefinementCtx,
): void {
  if (
    !data.publishAt ||
    !data.expiresAt
  ) {
    return;
  }

  const publishTime =
    new Date(
      data.publishAt,
    ).getTime();

  const expiryTime =
    new Date(
      data.expiresAt,
    ).getTime();

  if (
    Number.isNaN(publishTime) ||
    Number.isNaN(expiryTime)
  ) {
    return;
  }

  if (
    expiryTime <= publishTime
  ) {
    context.addIssue({
      code:
        z.ZodIssueCode.custom,

      path: [
        "expiresAt",
      ],

      message:
        "Expiry date must be after the publish date",
    });
  }
}

const createAnnouncementBodySchema =
  announcementFieldsSchema
    .extend({
      audience:
        announcementAudienceSchema
          .default("ALL"),

      isPinned:
        z
          .boolean()
          .default(false),
    })
    .superRefine(
      validateAnnouncementDates,
    );

const updateAnnouncementBodySchema =
  announcementFieldsSchema
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
    )
    .superRefine(
      validateAnnouncementDates,
    );

export const createAnnouncementSchema =
  z.object({
    body:
      createAnnouncementBodySchema,
  });

export const updateAnnouncementSchema =
  z.object({
    params: z.object({
      id: z
        .string()
        .trim()
        .min(
          1,
          "Announcement ID is required",
        ),
    }),

    body:
      updateAnnouncementBodySchema,
  });

export const announcementIdSchema =
  z.object({
    params: z.object({
      id: z
        .string()
        .trim()
        .min(
          1,
          "Announcement ID is required",
        ),
    }),
  });

export type CreateAnnouncementInput =
  z.infer<
    typeof createAnnouncementSchema
  >["body"];

export type UpdateAnnouncementInput =
  z.infer<
    typeof updateAnnouncementSchema
  >["body"];