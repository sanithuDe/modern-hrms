import {
  PerformanceStatus,
  Prisma,
  UserRole,
} from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";

import type {
  CreatePerformanceInput,
  UpdatePerformanceInput,
} from "./performance.schema.js";

interface PerformanceViewer {
  userId: string;
  role: UserRole;
}

interface PerformanceScores {
  productivityScore: number;
  qualityScore: number;
  teamworkScore: number;
  attendanceScore: number;
  communicationScore: number;
}

const performanceInclude = {
  employee: {
    select: {
      id: true,
      employeeNumber: true,
      firstName: true,
      lastName: true,

      department: {
        select: {
          id: true,
          name: true,
        },
      },

      position: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  },

  createdBy: {
    select: {
      id: true,
      employeeNumber: true,
      firstName: true,
      lastName: true,
    },
  },
} satisfies Prisma.PerformanceReviewInclude;

function calculateOverallScore(
  scores: PerformanceScores,
): number {
  const total =
    scores.productivityScore +
    scores.qualityScore +
    scores.teamworkScore +
    scores.attendanceScore +
    scores.communicationScore;

  return Number(
    (total / 5).toFixed(2),
  );
}

async function getEmployeeByUserId(
  userId: string,
) {
  const employee =
    await prisma.employee.findUnique({
      where: {
        userId,
      },

      select: {
        id: true,
      },
    });

  if (!employee) {
    throw new Error(
      "Employee profile not found for this user",
    );
  }

  return employee;
}

async function validateEmployee(
  employeeId: string,
): Promise<void> {
  const employee =
    await prisma.employee.findUnique({
      where: {
        id: employeeId,
      },

      select: {
        id: true,
        isActive: true,
      },
    });

  if (!employee) {
    throw new Error(
      "Selected employee does not exist",
    );
  }

  if (!employee.isActive) {
    throw new Error(
      "Performance reviews cannot be created for an inactive employee",
    );
  }
}

async function checkReviewAccess(
  reviewEmployeeId: string,
  viewer: PerformanceViewer,
): Promise<void> {
  if (
    viewer.role ===
      UserRole.SUPER_ADMIN ||
    viewer.role ===
      UserRole.HR_MANAGER
  ) {
    return;
  }

  const employee =
    await getEmployeeByUserId(
      viewer.userId,
    );

  if (
    employee.id !==
    reviewEmployeeId
  ) {
    throw new Error(
      "You are not allowed to view this performance review",
    );
  }
}

export async function createPerformanceReview(
  input: CreatePerformanceInput,
  createdByUserId: string,
) {
  await validateEmployee(
    input.employeeId,
  );

  const creator =
    await prisma.employee.findUnique({
      where: {
        userId:
          createdByUserId,
      },

      select: {
        id: true,
      },
    });

  const overallScore =
    calculateOverallScore({
      productivityScore:
        input.productivityScore,

      qualityScore:
        input.qualityScore,

      teamworkScore:
        input.teamworkScore,

      attendanceScore:
        input.attendanceScore,

      communicationScore:
        input.communicationScore,
    });

  return prisma.performanceReview.create({
    data: {
      employeeId:
        input.employeeId,

      createdById:
        creator?.id ?? null,

      title:
        input.title.trim(),

      reviewDate:
        new Date(
          input.reviewDate,
        ),

      period:
        input.period,

      productivityScore:
        input.productivityScore,

      qualityScore:
        input.qualityScore,

      teamworkScore:
        input.teamworkScore,

      attendanceScore:
        input.attendanceScore,

      communicationScore:
        input.communicationScore,

      overallScore:
        new Prisma.Decimal(
          overallScore,
        ),

      strengths:
        input.strengths?.trim() ||
        null,

      improvements:
        input.improvements?.trim() ||
        null,

      reviewerComments:
        input.reviewerComments?.trim() ||
        null,
    },

    include:
      performanceInclude,
  });
}

export async function getPerformanceReviews(
  viewer: PerformanceViewer,
) {
  if (
    viewer.role ===
      UserRole.SUPER_ADMIN ||
    viewer.role ===
      UserRole.HR_MANAGER
  ) {
    return prisma.performanceReview.findMany({
      include:
        performanceInclude,

      orderBy: {
        reviewDate:
          "desc",
      },
    });
  }

  const employee =
    await getEmployeeByUserId(
      viewer.userId,
    );

  return prisma.performanceReview.findMany({
    where: {
      employeeId:
        employee.id,
    },

    include:
      performanceInclude,

    orderBy: {
      reviewDate:
        "desc",
    },
  });
}

export async function getPerformanceReviewById(
  id: string,
  viewer: PerformanceViewer,
) {
  const review =
    await prisma.performanceReview.findUnique({
      where: {
        id,
      },

      include:
        performanceInclude,
    });

  if (!review) {
    throw new Error(
      "Performance review not found",
    );
  }

  await checkReviewAccess(
    review.employeeId,
    viewer,
  );

  return review;
}

export async function updatePerformanceReview(
  id: string,
  input: UpdatePerformanceInput,
) {
  const currentReview =
    await prisma.performanceReview.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        employeeId: true,
        status: true,

        productivityScore:
          true,

        qualityScore:
          true,

        teamworkScore:
          true,

        attendanceScore:
          true,

        communicationScore:
          true,
      },
    });

  if (!currentReview) {
    throw new Error(
      "Performance review not found",
    );
  }

  if (
    currentReview.status ===
    PerformanceStatus.COMPLETED
  ) {
    throw new Error(
      "A completed performance review cannot be edited",
    );
  }

  const employeeId =
    input.employeeId ??
    currentReview.employeeId;

  if (
    input.employeeId !==
    undefined
  ) {
    await validateEmployee(
      input.employeeId,
    );
  }

  const productivityScore =
    input.productivityScore ??
    currentReview.productivityScore;

  const qualityScore =
    input.qualityScore ??
    currentReview.qualityScore;

  const teamworkScore =
    input.teamworkScore ??
    currentReview.teamworkScore;

  const attendanceScore =
    input.attendanceScore ??
    currentReview.attendanceScore;

  const communicationScore =
    input.communicationScore ??
    currentReview.communicationScore;

  const overallScore =
    calculateOverallScore({
      productivityScore,
      qualityScore,
      teamworkScore,
      attendanceScore,
      communicationScore,
    });

  return prisma.performanceReview.update({
    where: {
      id,
    },

    data: {
      employeeId,

      ...(input.title !==
        undefined && {
        title:
          input.title.trim(),
      }),

      ...(input.reviewDate !==
        undefined && {
        reviewDate:
          new Date(
            input.reviewDate,
          ),
      }),

      ...(input.period !==
        undefined && {
        period:
          input.period,
      }),

      productivityScore,
      qualityScore,
      teamworkScore,
      attendanceScore,
      communicationScore,

      overallScore:
        new Prisma.Decimal(
          overallScore,
        ),

      ...(input.strengths !==
        undefined && {
        strengths:
          input.strengths.trim() ||
          null,
      }),

      ...(input.improvements !==
        undefined && {
        improvements:
          input.improvements.trim() ||
          null,
      }),

      ...(input.reviewerComments !==
        undefined && {
        reviewerComments:
          input.reviewerComments.trim() ||
          null,
      }),
    },

    include:
      performanceInclude,
  });
}

export async function completePerformanceReview(
  id: string,
) {
  const review =
    await prisma.performanceReview.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        status: true,
      },
    });

  if (!review) {
    throw new Error(
      "Performance review not found",
    );
  }

  if (
    review.status ===
    PerformanceStatus.COMPLETED
  ) {
    throw new Error(
      "Performance review is already completed",
    );
  }

  return prisma.performanceReview.update({
    where: {
      id,
    },

    data: {
      status:
        PerformanceStatus.COMPLETED,
    },

    include:
      performanceInclude,
  });
}

export async function addEmployeePerformanceComment(
  id: string,
  employeeComments: string,
  userId: string,
) {
  const employee =
    await getEmployeeByUserId(
      userId,
    );

  const review =
    await prisma.performanceReview.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        employeeId: true,
      },
    });

  if (!review) {
    throw new Error(
      "Performance review not found",
    );
  }

  if (
    review.employeeId !==
    employee.id
  ) {
    throw new Error(
      "You cannot comment on another employee's performance review",
    );
  }

  return prisma.performanceReview.update({
    where: {
      id,
    },

    data: {
      employeeComments:
        employeeComments.trim(),
    },

    include:
      performanceInclude,
  });
}

export async function deletePerformanceReview(
  id: string,
) {
  const review =
    await prisma.performanceReview.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        status: true,
      },
    });

  if (!review) {
    throw new Error(
      "Performance review not found",
    );
  }

  if (
    review.status ===
    PerformanceStatus.COMPLETED
  ) {
    throw new Error(
      "A completed performance review cannot be deleted",
    );
  }

  await prisma.performanceReview.delete({
    where: {
      id,
    },
  });

  return {
    id: review.id,
  };
}