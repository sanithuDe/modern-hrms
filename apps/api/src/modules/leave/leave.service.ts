import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

import type {
    CreateLeaveBalanceInput,
    CreateLeaveRequestInput,
    CreateLeaveTypeInput,
    ReviewLeaveRequestInput,
    UpdateLeaveBalanceInput,
    UpdateLeaveTypeInput,
} from "./leave.schema.js";

const leaveTypeInclude = {
  _count: {
    select: {
      leaveBalances: true,
      leaveRequests: true,
    },
  },
} as const;

const leaveBalanceInclude = {
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

  leaveType: {
    select: {
      id: true,
      name: true,
      description: true,
      defaultDays: true,
      isActive: true,
    },
  },
} as const;

const leaveRequestInclude = {
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

  leaveType: {
    select: {
      id: true,
      name: true,
      description: true,
      defaultDays: true,
      isActive: true,
    },
  },

  reviewedBy: {
    select: {
      id: true,
      email: true,
      role: true,
    },
  },
} as const;

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
        employeeNumber: true,
        firstName: true,
        lastName: true,
      },
    });

  if (!employee) {
    throw new Error(
      "Employee profile was not found for this user",
    );
  }

  return employee;
}

function normalizeDate(
  date: Date,
): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    ),
  );
}

function calculateTotalDays(
  startDate: Date,
  endDate: Date,
): number {
  const normalizedStart =
    normalizeDate(startDate);

  const normalizedEnd =
    normalizeDate(endDate);

  const difference =
    normalizedEnd.getTime() -
    normalizedStart.getTime();

  const millisecondsPerDay =
    1000 * 60 * 60 * 24;

  return (
    Math.floor(
      difference /
        millisecondsPerDay,
    ) + 1
  );
}

export async function createLeaveType(
  input: CreateLeaveTypeInput,
) {
  const existingLeaveType =
    await prisma.leaveType.findUnique({
      where: {
        name: input.name,
      },

      select: {
        id: true,
      },
    });

  if (existingLeaveType) {
    throw new Error(
      "A leave type with this name already exists",
    );
  }

  return prisma.leaveType.create({
    data: {
      name: input.name,
      description:
        input.description || null,
      defaultDays:
        input.defaultDays,
      isActive:
        input.isActive ?? true,
    },

    include: leaveTypeInclude,
  });
}

export async function updateLeaveType(
  id: string,
  input: UpdateLeaveTypeInput,
) {
  const leaveType =
    await prisma.leaveType.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
      },
    });

  if (!leaveType) {
    throw new Error(
      "Leave type not found",
    );
  }

  if (input.name !== undefined) {
    const duplicate =
      await prisma.leaveType.findFirst({
        where: {
          name: input.name,

          id: {
            not: id,
          },
        },

        select: {
          id: true,
        },
      });

    if (duplicate) {
      throw new Error(
        "A leave type with this name already exists",
      );
    }
  }

  return prisma.leaveType.update({
    where: {
      id,
    },

    data: {
      ...(input.name !== undefined
        ? {
            name: input.name,
          }
        : {}),

      ...(input.description !== undefined
        ? {
            description:
              input.description,
          }
        : {}),

      ...(input.defaultDays !== undefined
        ? {
            defaultDays:
              input.defaultDays,
          }
        : {}),

      ...(input.isActive !== undefined
        ? {
            isActive:
              input.isActive,
          }
        : {}),
    },

    include: leaveTypeInclude,
  });
}

export async function getLeaveTypes(
  activeOnly = false,
) {
  return prisma.leaveType.findMany({
    where: activeOnly
      ? {
          isActive: true,
        }
      : undefined,

    include: leaveTypeInclude,

    orderBy: {
      name: "asc",
    },
  });
}

export async function createLeaveBalance(
  input: CreateLeaveBalanceInput,
) {
  const employee =
    await prisma.employee.findUnique({
      where: {
        id: input.employeeId,
      },

      select: {
        id: true,
      },
    });

  if (!employee) {
    throw new Error(
      "Employee not found",
    );
  }

  const leaveType =
    await prisma.leaveType.findUnique({
      where: {
        id: input.leaveTypeId,
      },

      select: {
        id: true,
        isActive: true,
      },
    });

  if (!leaveType) {
    throw new Error(
      "Leave type not found",
    );
  }

  const existingBalance =
    await (prisma as any).leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId:
            input.employeeId,
          leaveTypeId:
            input.leaveTypeId,
          year: input.year,
        },
      },

      select: {
        id: true,
      },
    });

  if (existingBalance) {
    throw new Error(
      "Leave balance already exists for this employee, leave type, and year",
    );
  }

  return (prisma as any).leaveBalance.create({
    data: {
      employeeId:
        input.employeeId,
      leaveTypeId:
        input.leaveTypeId,
      year: input.year,
      allocatedDays:
        input.allocatedDays,
      usedDays: 0,
    },

    include: leaveBalanceInclude,
  });
}

export async function updateLeaveBalance(
  id: string,
  input: UpdateLeaveBalanceInput,
) {
  const leaveBalance =
    await (prisma as any).leaveBalance.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        allocatedDays: true,
        usedDays: true,
      },
    });

  if (!leaveBalance) {
    throw new Error(
      "Leave balance not found",
    );
  }

  const allocatedDays =
    input.allocatedDays ??
    Number(
      leaveBalance.allocatedDays,
    );

  const usedDays =
    input.usedDays ??
    Number(leaveBalance.usedDays);

  if (usedDays > allocatedDays) {
    throw new Error(
      "Used days cannot exceed allocated days",
    );
  }

  return (prisma as any).leaveBalance.update({
    where: {
      id,
    },

    data: {
      ...(input.allocatedDays !== undefined
        ? {
            allocatedDays:
              input.allocatedDays,
          }
        : {}),

      ...(input.usedDays !== undefined
        ? {
            usedDays:
              input.usedDays,
          }
        : {}),
    },

    include: leaveBalanceInclude,
  });
}

export async function getLeaveBalances() {
  return (prisma as any).leaveBalance.findMany({
    include: leaveBalanceInclude,

    orderBy: [
      {
        year: "desc",
      },
      {
        employee: {
          firstName: "asc",
        },
      },
    ],
  });
}

export async function getMyLeaveBalances(
  userId: string,
) {
  const employee =
    await getEmployeeByUserId(userId);

  return (prisma as any).leaveBalance.findMany({
    where: {
      employeeId: employee.id,
    },

    include: leaveBalanceInclude,

    orderBy: [
      {
        year: "desc",
      },
      {
        leaveType: {
          name: "asc",
        },
      },
    ],
  });
}

export async function createLeaveRequest(
  userId: string,
  input: CreateLeaveRequestInput,
) {
  const employee =
    await getEmployeeByUserId(userId);

  const leaveType =
    await prisma.leaveType.findUnique({
      where: {
        id: input.leaveTypeId,
      },

      select: {
        id: true,
        isActive: true,
      },
    });

  if (!leaveType) {
    throw new Error(
      "Leave type not found",
    );
  }

  if (!leaveType.isActive) {
    throw new Error(
      "This leave type is currently inactive",
    );
  }

  const startDate = normalizeDate(
    new Date(input.startDate),
  );

  const endDate = normalizeDate(
    new Date(input.endDate),
  );

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime())
  ) {
    throw new Error(
      "Invalid leave dates",
    );
  }

  if (endDate < startDate) {
    throw new Error(
      "End date cannot be before start date",
    );
  }

  const totalDays =
    calculateTotalDays(
      startDate,
      endDate,
    );

  if (totalDays <= 0) {
    throw new Error(
      "Leave request must contain at least one day",
    );
  }

  const currentYear =
    startDate.getUTCFullYear();

  if (
    endDate.getUTCFullYear() !==
    currentYear
  ) {
    throw new Error(
      "A leave request cannot span multiple years",
    );
  }

  const overlappingRequest =
    await prisma.leaveRequest.findFirst({
      where: {
        employeeId: employee.id,

        status: {
          in: [
            "PENDING",
            "APPROVED",
          ],
        },

        startDate: {
          lte: endDate,
        },

        endDate: {
          gte: startDate,
        },
      },

      select: {
        id: true,
      },
    });

  if (overlappingRequest) {
    throw new Error(
      "You already have a pending or approved leave request for these dates",
    );
  }

  const leaveBalance =
    await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: employee.id,
          leaveTypeId:
            input.leaveTypeId,
          year: currentYear,
        },
      },

      select: {
        allocatedDays: true,
        usedDays: true,
      },
    });

  if (!leaveBalance) {
    throw new Error(
      "No leave balance exists for this leave type and year",
    );
  }

  const remainingDays =
    Number(
      leaveBalance.allocatedDays,
    ) -
    Number(leaveBalance.usedDays);

  if (totalDays > remainingDays) {
    throw new Error(
      `Insufficient leave balance. Remaining days: ${remainingDays}`,
    );
  }

  return prisma.leaveRequest.create({
    data: {
      employeeId: employee.id,
      leaveTypeId:
        input.leaveTypeId,
      startDate,
      endDate,
      totalDays,
      reason: input.reason,
    },

    include: leaveRequestInclude,
  });
}

export async function getMyLeaveRequests(
  userId: string,
) {
  const employee =
    await getEmployeeByUserId(userId);

  return prisma.leaveRequest.findMany({
    where: {
      employeeId: employee.id,
    },

    include: leaveRequestInclude,

    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getLeaveRequests() {
  return prisma.leaveRequest.findMany({
    include: leaveRequestInclude,

    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function reviewLeaveRequest(
  id: string,
  reviewerUserId: string,
  input: ReviewLeaveRequestInput,
) {
  const leaveRequest =
    await prisma.leaveRequest.findUnique({
      where: {
        id,
      },

      include: {
        leaveType: {
          select: {
            id: true,
          },
        },
      },
    });

  if (!leaveRequest) {
    throw new Error(
      "Leave request not found",
    );
  }

  if (
    leaveRequest.status !== "PENDING"
  ) {
    throw new Error(
      "Only pending leave requests can be reviewed",
    );
  }

  if (
    input.decision === "REJECTED"
  ) {
    return prisma.leaveRequest.update({
      where: {
        id,
      },

      data: {
        status: "REJECTED",
        reviewedById:
          reviewerUserId,
        reviewComment:
          input.reviewComment ?? null,
        reviewedAt: new Date(),
      },

      include: leaveRequestInclude,
    });
  }

  const year =
    leaveRequest.startDate.getUTCFullYear();

  return prisma.$transaction(
    async (transaction: Prisma.TransactionClient) => {
      const balance =
        await transaction.leaveBalance.findUnique({
          where: {
            employeeId_leaveTypeId_year: {
              employeeId:
                leaveRequest.employeeId,
              leaveTypeId:
                leaveRequest.leaveTypeId,
              year,
            },
          },
        });

      if (!balance) {
        throw new Error(
          "Leave balance not found for this request",
        );
      }

      const allocatedDays =
        Number(balance.allocatedDays);

      const usedDays =
        Number(balance.usedDays);

      const requestedDays =
        Number(
          leaveRequest.totalDays,
        );

      const remainingDays =
        allocatedDays - usedDays;

      if (
        requestedDays >
        remainingDays
      ) {
        throw new Error(
          `Insufficient leave balance. Remaining days: ${remainingDays}`,
        );
      }

      await transaction.leaveBalance.update({
        where: {
          id: balance.id,
        },

        data: {
          usedDays: {
            increment:
              requestedDays,
          },
        },
      });

      return transaction.leaveRequest.update({
        where: {
          id,
        },

        data: {
          status: "APPROVED",
          reviewedById:
            reviewerUserId,
          reviewComment:
            input.reviewComment ?? null,
          reviewedAt: new Date(),
        },

        include:
          leaveRequestInclude,
      });
    },
  );
}

export async function cancelMyLeaveRequest(
  id: string,
  userId: string,
) {
  const employee =
    await getEmployeeByUserId(userId);

  const leaveRequest =
    await prisma.leaveRequest.findFirst({
      where: {
        id,
        employeeId: employee.id,
      },

      select: {
        id: true,
        status: true,
      },
    });

  if (!leaveRequest) {
    throw new Error(
      "Leave request not found",
    );
  }

  if (
    leaveRequest.status !== "PENDING"
  ) {
    throw new Error(
      "Only pending leave requests can be cancelled",
    );
  }

  return prisma.leaveRequest.update({
    where: {
      id,
    },

    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
    },

    include: leaveRequestInclude,
  });
}