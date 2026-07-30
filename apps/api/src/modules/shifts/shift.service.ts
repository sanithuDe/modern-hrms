import {
  type Prisma,
} from "../../generated/prisma/client.js";

import {
  prisma,
} from "../../lib/prisma.js";

import type {
  AssignShiftInput,
  CreateShiftInput,
  UpdateShiftAssignmentInput,
  UpdateShiftInput,
} from "./shift.schema.js";

const assignmentInclude = {
  shift: true,

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
} satisfies Prisma.EmployeeShiftAssignmentInclude;

export async function createShift(
  input: CreateShiftInput,
) {
  const existingShift =
    await prisma.shift.findUnique({
      where: {
        code: input.code,
      },

      select: {
        id: true,
      },
    });

  if (existingShift) {
    throw new Error(
      "A shift with this code already exists",
    );
  }

  return prisma.shift.create({
    data: {
      name: input.name.trim(),

      code: input.code
        .trim()
        .toUpperCase(),

      startTimeMinutes:
        input.startTimeMinutes,

      endTimeMinutes:
        input.endTimeMinutes,

      crossesMidnight:
        input.crossesMidnight,

      graceMinutes:
        input.graceMinutes,

      requiredWorkMinutes:
        input.requiredWorkMinutes,

      isActive:
        input.isActive,
    },
  });
}

export async function getShifts() {
  return prisma.shift.findMany({
    orderBy: [
      {
        isActive: "desc",
      },
      {
        name: "asc",
      },
    ],
  });
}

export async function updateShift(
  shiftId: string,
  input: UpdateShiftInput,
) {
  const existingShift =
    await prisma.shift.findUnique({
      where: {
        id: shiftId,
      },

      select: {
        id: true,
      },
    });

  if (!existingShift) {
    throw new Error(
      "Shift was not found",
    );
  }

  if (input.code) {
    const duplicateCode =
      await prisma.shift.findFirst({
        where: {
          code: input.code
            .trim()
            .toUpperCase(),

          id: {
            not: shiftId,
          },
        },

        select: {
          id: true,
        },
      });

    if (duplicateCode) {
      throw new Error(
        "A shift with this code already exists",
      );
    }
  }

  return prisma.shift.update({
    where: {
      id: shiftId,
    },

    data: {
      ...(input.name !== undefined
        ? {
            name:
              input.name.trim(),
          }
        : {}),

      ...(input.code !== undefined
        ? {
            code: input.code
              .trim()
              .toUpperCase(),
          }
        : {}),

      ...(input.startTimeMinutes !==
      undefined
        ? {
            startTimeMinutes:
              input.startTimeMinutes,
          }
        : {}),

      ...(input.endTimeMinutes !==
      undefined
        ? {
            endTimeMinutes:
              input.endTimeMinutes,
          }
        : {}),

      ...(input.crossesMidnight !==
      undefined
        ? {
            crossesMidnight:
              input.crossesMidnight,
          }
        : {}),

      ...(input.graceMinutes !==
      undefined
        ? {
            graceMinutes:
              input.graceMinutes,
          }
        : {}),

      ...(input.requiredWorkMinutes !==
      undefined
        ? {
            requiredWorkMinutes:
              input.requiredWorkMinutes,
          }
        : {}),

      ...(input.isActive !== undefined
        ? {
            isActive:
              input.isActive,
          }
        : {}),
    },
  });
}

export async function assignShift(
  input: AssignShiftInput,
  assignedById: string,
) {
  const employee =
    await prisma.employee.findFirst({
      where: {
        id: input.employeeId,
        isActive: true,
      },

      select: {
        id: true,
      },
    });

  if (!employee) {
    throw new Error(
      "Active employee was not found",
    );
  }

  const shift =
    await prisma.shift.findFirst({
      where: {
        id: input.shiftId,
        isActive: true,
      },

      select: {
        id: true,
      },
    });

  if (!shift) {
    throw new Error(
      "Active shift was not found",
    );
  }

  const effectiveFrom =
    new Date(
      input.effectiveFrom,
    );

  const effectiveTo =
    input.effectiveTo
      ? new Date(
          input.effectiveTo,
        )
      : null;

  if (
    Number.isNaN(
      effectiveFrom.getTime(),
    )
  ) {
    throw new Error(
      "Effective start date is invalid",
    );
  }

  if (
    effectiveTo &&
    Number.isNaN(
      effectiveTo.getTime(),
    )
  ) {
    throw new Error(
      "Effective end date is invalid",
    );
  }

  if (
    effectiveTo &&
    effectiveTo < effectiveFrom
  ) {
    throw new Error(
      "Effective end date must be after the start date",
    );
  }

  return prisma.$transaction(
    async (transaction) => {
      /*
       * Close previous active assignments.
       */
      await transaction
        .employeeShiftAssignment
        .updateMany({
          where: {
            employeeId:
              input.employeeId,

            isActive: true,
          },

          data: {
            isActive: false,

            effectiveTo:
              effectiveFrom,
          },
        });

      return transaction
        .employeeShiftAssignment
        .create({
          data: {
            employeeId:
              input.employeeId,

            shiftId:
              input.shiftId,

            effectiveFrom,
            effectiveTo,

            isActive: true,
            assignedById,
          },

          include:
            assignmentInclude,
        });
    },
  );
}

export async function getShiftAssignments() {
  return prisma
    .employeeShiftAssignment
    .findMany({
      include:
        assignmentInclude,

      orderBy: [
        {
          isActive: "desc",
        },
        {
          effectiveFrom: "desc",
        },
      ],
    });
}

export async function updateShiftAssignment(
  assignmentId: string,
  input: UpdateShiftAssignmentInput,
) {
  const existing =
    await prisma.employeeShiftAssignment.findUnique({
      where: { id: assignmentId },
      select: {
        id: true,
        employeeId: true,
        shiftId: true,
        effectiveFrom: true,
        effectiveTo: true,
        isActive: true,
      },
    });

  if (!existing) {
    throw new Error(
      "Shift assignment was not found",
    );
  }

  if (input.shiftId) {
    const shift =
      await prisma.shift.findFirst({
        where: {
          id: input.shiftId,
          isActive: true,
        },
        select: { id: true },
      });

    if (!shift) {
      throw new Error(
        "Active shift was not found",
      );
    }
  }

  const nextFrom =
    input.effectiveFrom !== undefined
      ? new Date(input.effectiveFrom)
      : existing.effectiveFrom;

  const nextTo =
    input.effectiveTo !== undefined
      ? input.effectiveTo
        ? new Date(input.effectiveTo)
        : null
      : existing.effectiveTo;

  if (Number.isNaN(nextFrom.getTime())) {
    throw new Error(
      "Effective start date is invalid",
    );
  }

  if (
    nextTo &&
    Number.isNaN(nextTo.getTime())
  ) {
    throw new Error(
      "Effective end date is invalid",
    );
  }

  if (nextTo && nextTo < nextFrom) {
    throw new Error(
      "Effective end date must be after the start date",
    );
  }

  const willBeActive =
    input.isActive !== undefined
      ? input.isActive
      : existing.isActive;

  return prisma.$transaction(
    async (transaction) => {
      if (willBeActive) {
        await transaction
          .employeeShiftAssignment
          .updateMany({
            where: {
              employeeId:
                existing.employeeId,
              isActive: true,
              id: {
                not: assignmentId,
              },
            },
            data: {
              isActive: false,
              effectiveTo: nextFrom,
            },
          });
      }

      return transaction
        .employeeShiftAssignment
        .update({
          where: { id: assignmentId },
          data: {
            ...(input.shiftId !== undefined
              ? { shiftId: input.shiftId }
              : {}),
            ...(input.effectiveFrom !== undefined
              ? { effectiveFrom: nextFrom }
              : {}),
            ...(input.effectiveTo !== undefined
              ? { effectiveTo: nextTo }
              : {}),
            ...(input.isActive !== undefined
              ? { isActive: input.isActive }
              : {}),
          },
          include: assignmentInclude,
        });
    },
  );
}

export async function deleteShiftAssignment(
  assignmentId: string,
) {
  const existing =
    await prisma.employeeShiftAssignment.findUnique({
      where: { id: assignmentId },
      select: { id: true },
    });

  if (!existing) {
    throw new Error(
      "Shift assignment was not found",
    );
  }

  await prisma.employeeShiftAssignment.delete({
    where: { id: assignmentId },
  });
}

export async function getMyAssignedShift(
  userId: string,
) {
  const employee =
    await prisma.employee.findFirst({
      where: {
        userId,
        isActive: true,
      },

      select: {
        id: true,
      },
    });

  /*
   * Some HR Manager or Super Admin accounts
   * may not have an employee profile.
   *
   * Return null instead of throwing a 500.
   */
  if (!employee) {
    return null;
  }

  const now =
    new Date();

  return prisma
    .employeeShiftAssignment
    .findFirst({
      where: {
        employeeId:
          employee.id,

        isActive: true,

        effectiveFrom: {
          lte: now,
        },

        OR: [
          {
            effectiveTo: null,
          },
          {
            effectiveTo: {
              gte: now,
            },
          },
        ],

        shift: {
          isActive: true,
        },
      },

      include:
        assignmentInclude,

      orderBy: {
        effectiveFrom: "desc",
      },
    });
}