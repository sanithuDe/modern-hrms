import {
  AnnouncementAudience,
  AnnouncementStatus,
  Prisma,
  UserRole,
} from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";

import type {
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
} from "./announcement.schema.js";

interface AnnouncementViewer {
  userId: string;
  role: UserRole;
}

const announcementInclude = {
  createdBy: {
    select: {
      id: true,
      email: true,
      role: true,

      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeNumber: true,
        },
      },
    },
  },
} satisfies Prisma.AnnouncementInclude;

function parseOptionalDate(
  value:
    | string
    | null
    | undefined,
): Date | null {
  if (!value) {
    return null;
  }

  return new Date(value);
}

function isManager(
  role: UserRole,
): boolean {
  return (
    role === UserRole.SUPER_ADMIN ||
    role === UserRole.HR_MANAGER
  );
}

function getAudienceForRole(
  role: UserRole,
): AnnouncementAudience {
  if (
    role === UserRole.SUPER_ADMIN
  ) {
    return AnnouncementAudience.SUPER_ADMIN;
  }

  if (
    role === UserRole.HR_MANAGER
  ) {
    return AnnouncementAudience.HR_MANAGER;
  }

  return AnnouncementAudience.EMPLOYEE;
}

export async function createAnnouncement(
  input: CreateAnnouncementInput,
  createdById: string,
) {
  const user =
    await prisma.user.findUnique({
      where: {
        id: createdById,
      },

      select: {
        id: true,
        status: true,
      },
    });

  if (!user) {
    throw new Error(
      "Announcement creator was not found",
    );
  }

  return prisma.announcement.create({
    data: {
      title:
        input.title.trim(),

      content:
        input.content.trim(),

      audience:
        input.audience,

      isPinned:
        input.isPinned,

      publishAt:
        parseOptionalDate(
          input.publishAt,
        ),

      expiresAt:
        parseOptionalDate(
          input.expiresAt,
        ),

      createdById,

      status:
        AnnouncementStatus.DRAFT,
    },

    include:
      announcementInclude,
  });
}

export async function getAnnouncements(
  viewer: AnnouncementViewer,
) {
  if (isManager(viewer.role)) {
    return prisma.announcement.findMany({
      include:
        announcementInclude,

      orderBy: [
        {
          isPinned: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });
  }

  const now = new Date();

  return prisma.announcement.findMany({
    where: {
      status:
        AnnouncementStatus.PUBLISHED,

      audience: {
        in: [
          AnnouncementAudience.ALL,
          getAudienceForRole(
            viewer.role,
          ),
        ],
      },

      AND: [
        {
          OR: [
            {
              publishAt: null,
            },
            {
              publishAt: {
                lte: now,
              },
            },
          ],
        },

        {
          OR: [
            {
              expiresAt: null,
            },
            {
              expiresAt: {
                gt: now,
              },
            },
          ],
        },
      ],
    },

    include:
      announcementInclude,

    orderBy: [
      {
        isPinned: "desc",
      },
      {
        publishAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
  });
}

export async function getAnnouncementById(
  id: string,
  viewer: AnnouncementViewer,
) {
  const announcement =
    await prisma.announcement.findUnique({
      where: {
        id,
      },

      include:
        announcementInclude,
    });

  if (!announcement) {
    throw new Error(
      "Announcement not found",
    );
  }

  if (isManager(viewer.role)) {
    return announcement;
  }

  const now = new Date();

  const allowedAudience =
    announcement.audience ===
      AnnouncementAudience.ALL ||
    announcement.audience ===
      getAudienceForRole(
        viewer.role,
      );

  const hasStarted =
    !announcement.publishAt ||
    announcement.publishAt <= now;

  const hasNotExpired =
    !announcement.expiresAt ||
    announcement.expiresAt > now;

  if (
    announcement.status !==
      AnnouncementStatus.PUBLISHED ||
    !allowedAudience ||
    !hasStarted ||
    !hasNotExpired
  ) {
    throw new Error(
      "You are not allowed to view this announcement",
    );
  }

  return announcement;
}

export async function updateAnnouncement(
  id: string,
  input: UpdateAnnouncementInput,
) {
  const announcement =
    await prisma.announcement.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        status: true,
        publishAt: true,
        expiresAt: true,
      },
    });

  if (!announcement) {
    throw new Error(
      "Announcement not found",
    );
  }

  if (
    announcement.status ===
    AnnouncementStatus.ARCHIVED
  ) {
    throw new Error(
      "An archived announcement cannot be edited",
    );
  }

  const publishAt =
    input.publishAt !== undefined
      ? parseOptionalDate(
          input.publishAt,
        )
      : announcement.publishAt;

  const expiresAt =
    input.expiresAt !== undefined
      ? parseOptionalDate(
          input.expiresAt,
        )
      : announcement.expiresAt;

  if (
    publishAt &&
    expiresAt &&
    expiresAt <= publishAt
  ) {
    throw new Error(
      "Expiry date must be after the publish date",
    );
  }

  return prisma.announcement.update({
    where: {
      id,
    },

    data: {
      ...(input.title !==
        undefined && {
        title:
          input.title.trim(),
      }),

      ...(input.content !==
        undefined && {
        content:
          input.content.trim(),
      }),

      ...(input.audience !==
        undefined && {
        audience:
          input.audience,
      }),

      ...(input.isPinned !==
        undefined && {
        isPinned:
          input.isPinned,
      }),

      ...(input.publishAt !==
        undefined && {
        publishAt,
      }),

      ...(input.expiresAt !==
        undefined && {
        expiresAt,
      }),
    },

    include:
      announcementInclude,
  });
}

export async function publishAnnouncement(
  id: string,
) {
  const announcement =
    await prisma.announcement.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        status: true,
        publishAt: true,
        expiresAt: true,
      },
    });

  if (!announcement) {
    throw new Error(
      "Announcement not found",
    );
  }

  if (
    announcement.status ===
    AnnouncementStatus.PUBLISHED
  ) {
    throw new Error(
      "Announcement is already published",
    );
  }

  if (
    announcement.status ===
    AnnouncementStatus.ARCHIVED
  ) {
    throw new Error(
      "An archived announcement cannot be published",
    );
  }

  const publishAt =
    announcement.publishAt ??
    new Date();

  if (
    announcement.expiresAt &&
    announcement.expiresAt <=
      publishAt
  ) {
    throw new Error(
      "The announcement expiry date must be after its publish date",
    );
  }

  return prisma.announcement.update({
    where: {
      id,
    },

    data: {
      status:
        AnnouncementStatus.PUBLISHED,

      publishAt,
    },

    include:
      announcementInclude,
  });
}

export async function archiveAnnouncement(
  id: string,
) {
  const announcement =
    await prisma.announcement.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        status: true,
      },
    });

  if (!announcement) {
    throw new Error(
      "Announcement not found",
    );
  }

  if (
    announcement.status ===
    AnnouncementStatus.ARCHIVED
  ) {
    throw new Error(
      "Announcement is already archived",
    );
  }

  return prisma.announcement.update({
    where: {
      id,
    },

    data: {
      status:
        AnnouncementStatus.ARCHIVED,

      isPinned: false,
    },

    include:
      announcementInclude,
  });
}

export async function deleteAnnouncement(
  id: string,
) {
  const announcement =
    await prisma.announcement.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        status: true,
      },
    });

  if (!announcement) {
    throw new Error(
      "Announcement not found",
    );
  }

  if (
    announcement.status ===
    AnnouncementStatus.PUBLISHED
  ) {
    throw new Error(
      "A published announcement must be archived before it can be deleted",
    );
  }

  await prisma.announcement.delete({
    where: {
      id,
    },
  });

  return {
    id: announcement.id,
  };
}