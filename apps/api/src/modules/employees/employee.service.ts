import bcrypt from "bcryptjs";

import {
  Prisma,
  UserRole,
  UserStatus,
} from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";

export interface CreateEmployeeInput {
  email: string;
  password: string;
  role: UserRole;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  phone?: string;
  hireDate: string | Date;
  departmentId?: string | null;
  positionId?: string | null;
  departmentName?: string | null;
  positionTitle?: string | null;
}

export interface UpdateEmployeeInput {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  hireDate?: string | Date;
  departmentId?: string | null;
  positionId?: string | null;
  departmentName?: string | null;
  positionTitle?: string | null;
  role?: UserRole;
  requesterRole: UserRole;
}

export interface UpdateEmployeeStatusInput {
  status: UserStatus;
  requesterRole: UserRole;
}

const employeeInclude = {
  user: {
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
    },
  },

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
} satisfies Prisma.EmployeeInclude;

async function resolveDepartmentId(
  input: {
    departmentId?: string | null;
    departmentName?: string | null;
  },
): Promise<string | null | undefined> {
  // undefined = not provided (keep existing on update)
  if (
    input.departmentName === undefined &&
    input.departmentId === undefined
  ) {
    return undefined;
  }

  if (
    input.departmentName !== undefined
  ) {
    const name =
      input.departmentName?.trim() || "";

    if (!name) {
      return null;
    }

    const existing =
      await prisma.department.findFirst({
        where: {
          name: {
            equals: name,
            mode: "insensitive",
          },
        },
        select: { id: true },
      });

    if (existing) {
      return existing.id;
    }

    const created =
      await prisma.department.create({
        data: { name },
        select: { id: true },
      });

    return created.id;
  }

  if (
    input.departmentId === null ||
    input.departmentId === ""
  ) {
    return null;
  }

  await validateDepartment(
    input.departmentId,
  );

  return input.departmentId ?? null;
}

async function resolvePositionId(
  input: {
    positionId?: string | null;
    positionTitle?: string | null;
    departmentId?: string | null;
  },
): Promise<string | null | undefined> {
  if (
    input.positionTitle === undefined &&
    input.positionId === undefined
  ) {
    return undefined;
  }

  if (
    input.positionTitle !== undefined
  ) {
    const title =
      input.positionTitle?.trim() || "";

    if (!title) {
      return null;
    }

    const existing =
      await prisma.position.findFirst({
        where: {
          title: {
            equals: title,
            mode: "insensitive",
          },
          ...(input.departmentId
            ? {
                OR: [
                  {
                    departmentId:
                      input.departmentId,
                  },
                  {
                    departmentId: null,
                  },
                ],
              }
            : {}),
        },
        select: { id: true },
        orderBy: {
          departmentId: "desc",
        },
      });

    if (existing) {
      if (
        input.departmentId &&
        existing
      ) {
        await prisma.position.update({
          where: { id: existing.id },
          data: {
            departmentId:
              input.departmentId,
          },
        });
      }

      return existing.id;
    }

    const created =
      await prisma.position.create({
        data: {
          title,
          departmentId:
            input.departmentId ?? null,
        },
        select: { id: true },
      });

    return created.id;
  }

  if (
    input.positionId === null ||
    input.positionId === ""
  ) {
    return null;
  }

  await validatePosition(
    input.positionId,
    input.departmentId,
  );

  return input.positionId ?? null;
}

function parseDate(
  value: string | Date,
  fieldName: string,
): Date {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      `${fieldName} must be a valid date`,
    );
  }

  return date;
}

async function validateDepartment(
  departmentId:
    | string
    | null
    | undefined,
): Promise<void> {
  if (!departmentId) {
    return;
  }

  const department =
    await prisma.department.findUnique({
      where: {
        id: departmentId,
      },
      select: {
        id: true,
      },
    });

  if (!department) {
    throw new Error(
      "Selected department does not exist",
    );
  }
}

async function validatePosition(
  positionId:
    | string
    | null
    | undefined,
  departmentId:
    | string
    | null
    | undefined,
): Promise<void> {
  if (!positionId) {
    return;
  }

  const position =
    await prisma.position.findUnique({
      where: {
        id: positionId,
      },
      select: {
        id: true,
        departmentId: true,
      },
    });

  if (!position) {
    throw new Error(
      "Selected position does not exist",
    );
  }

  if (
    departmentId &&
    position.departmentId !== departmentId
  ) {
    throw new Error(
      "Selected position does not belong to the selected department",
    );
  }
}

export async function createEmployee(
  input: CreateEmployeeInput,
) {
  const email =
    input.email.trim().toLowerCase();

  const employeeNumber =
    input.employeeNumber.trim();

  const firstName =
    input.firstName.trim();

  const lastName =
    input.lastName.trim();

  if (!email) {
    throw new Error("Email is required");
  }

  if (!employeeNumber) {
    throw new Error(
      "Employee number is required",
    );
  }

  if (!firstName) {
    throw new Error(
      "First name is required",
    );
  }

  if (!lastName) {
    throw new Error(
      "Last name is required",
    );
  }

  if (!input.password) {
    throw new Error(
      "Password is required",
    );
  }

  if (input.role === UserRole.SUPER_ADMIN) {
    throw new Error(
      "Super Admin accounts cannot be created from the employee section",
    );
  }

  const existingUser =
    await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

  if (existingUser) {
    throw new Error(
      "A user with this email already exists",
    );
  }

  const existingEmployee =
    await prisma.employee.findUnique({
      where: {
        employeeNumber,
      },
      select: {
        id: true,
      },
    });

  if (existingEmployee) {
    throw new Error(
      "An employee with this employee number already exists",
    );
  }

  const departmentId =
    (await resolveDepartmentId({
      departmentId: input.departmentId,
      departmentName: input.departmentName,
    })) ?? null;

  const positionId =
    (await resolvePositionId({
      positionId: input.positionId,
      positionTitle: input.positionTitle,
      departmentId,
    })) ?? null;

  const hireDate =
    parseDate(
      input.hireDate,
      "Hire date",
    );

  const passwordHash =
    await bcrypt.hash(
      input.password,
      12,
    );

  return prisma.$transaction(
    async (
      transaction:
        Prisma.TransactionClient,
    ) => {
      const user =
        await transaction.user.create({
          data: {
            email,
            passwordHash,
            role: input.role,
            status: UserStatus.ACTIVE,
          },
        });

      return transaction.employee.create({
        data: {
          userId: user.id,
          employeeNumber,
          firstName,
          lastName,
          phone:
            input.phone?.trim() || null,
          hireDate,
          departmentId,
          positionId,
        },
        include: employeeInclude,
      });
    },
  );
}

export async function getEmployees() {
  return prisma.employee.findMany({
    include: employeeInclude,
    orderBy: [
      {
        firstName: "asc",
      },
      {
        lastName: "asc",
      },
    ],
  });
}

export async function getEmployeeById(
  id: string,
) {
  const employee =
    await prisma.employee.findUnique({
      where: {
        id,
      },
      include: employeeInclude,
    });

  if (!employee) {
    throw new Error(
      "Employee not found",
    );
  }

  return employee;
}

export async function getMyEmployeeProfile(
  userId: string,
) {
  const employee =
    await prisma.employee.findUnique({
      where: {
        userId,
      },
      include: employeeInclude,
    });

  if (!employee) {
    throw new Error(
      "Employee profile not found",
    );
  }

  return employee;
}

export async function updateEmployee(
  id: string,
  input: UpdateEmployeeInput,
) {
  const existingEmployee =
    await prisma.employee.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        userId: true,
        departmentId: true,
        positionId: true,
        user: {
          select: {
            role: true,
          },
        },
      },
    });

  if (!existingEmployee) {
    throw new Error(
      "Employee not found",
    );
  }

  if (
    existingEmployee.user?.role ===
    UserRole.SUPER_ADMIN
  ) {
    throw new Error(
      "A Super Admin employee cannot be modified from the employee section",
    );
  }

  if (
    input.role === UserRole.SUPER_ADMIN
  ) {
    throw new Error(
      "An employee cannot be promoted to Super Admin",
    );
  }

  if (
    input.requesterRole ===
      UserRole.HR_MANAGER &&
    input.role !== undefined
  ) {
    throw new Error(
      "HR Managers cannot change employee roles",
    );
  }

  if (
    input.role !== undefined &&
    !existingEmployee.userId
  ) {
    throw new Error(
      "This employee does not have a linked user account",
    );
  }

  const resolvedDepartmentId =
    await resolveDepartmentId({
      departmentId: input.departmentId,
      departmentName: input.departmentName,
    });

  const departmentId =
    resolvedDepartmentId === undefined
      ? existingEmployee.departmentId
      : resolvedDepartmentId;

  const resolvedPositionId =
    await resolvePositionId({
      positionId: input.positionId,
      positionTitle: input.positionTitle,
      departmentId,
    });

  let positionId =
    resolvedPositionId === undefined
      ? existingEmployee.positionId
      : resolvedPositionId;

  // If department changed by ID path without position update, clear mismatched position
  if (
    input.departmentName === undefined &&
    input.departmentId !== undefined &&
    input.positionId === undefined &&
    input.positionTitle === undefined &&
    input.departmentId !==
      existingEmployee.departmentId
  ) {
    positionId = null;
  }

  // Clearing department should clear position unless a new position title was typed
  if (
    departmentId === null &&
    input.positionTitle === undefined &&
    input.positionId === undefined
  ) {
    positionId = null;
  }

  const employeeData:
    Prisma.EmployeeUncheckedUpdateInput =
      {};

  if (input.firstName !== undefined) {
    const firstName =
      input.firstName.trim();

    if (!firstName) {
      throw new Error(
        "First name cannot be empty",
      );
    }

    employeeData.firstName =
      firstName;
  }

  if (input.lastName !== undefined) {
    const lastName =
      input.lastName.trim();

    if (!lastName) {
      throw new Error(
        "Last name cannot be empty",
      );
    }

    employeeData.lastName =
      lastName;
  }

  if (input.phone !== undefined) {
    employeeData.phone =
      input.phone?.trim() || null;
  }

  if (input.hireDate !== undefined) {
    employeeData.hireDate =
      parseDate(
        input.hireDate,
        "Hire date",
      );
  }

  if (
    resolvedDepartmentId !== undefined
  ) {
    employeeData.departmentId =
      departmentId;
  }

  if (
    resolvedPositionId !== undefined ||
    positionId !==
      existingEmployee.positionId
  ) {
    employeeData.positionId =
      positionId;
  }

  return prisma.$transaction(
    async (
      transaction:
        Prisma.TransactionClient,
    ) => {
      if (
        input.role !== undefined &&
        existingEmployee.userId
      ) {
        await transaction.user.update({
          where: {
            id:
              existingEmployee.userId,
          },
          data: {
            role: input.role,
          },
        });
      }

      return transaction.employee.update({
        where: {
          id,
        },
        data: employeeData,
        include: employeeInclude,
      });
    },
  );
}

export async function updateEmployeeStatus(
  id: string,
  input: UpdateEmployeeStatusInput,
) {
  const employee =
    await prisma.employee.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            role: true,
          },
        },
      },
    });

  if (!employee) {
    throw new Error(
      "Employee not found",
    );
  }

  if (!employee.userId) {
    throw new Error(
      "This employee does not have a linked user account",
    );
  }

  if (
    input.requesterRole !==
      UserRole.SUPER_ADMIN &&
    input.requesterRole !==
      UserRole.HR_MANAGER
  ) {
    throw new Error(
      "You do not have permission to change employee status",
    );
  }

  if (
    employee.user?.role ===
    UserRole.SUPER_ADMIN
  ) {
    throw new Error(
      "A Super Admin account status cannot be changed",
    );
  }

  await prisma.user.update({
    where: {
      id: employee.userId,
    },
    data: {
      status: input.status,
    },
  });

  return getEmployeeById(id);
}

async function resolveFallbackUserId(
  transaction: Prisma.TransactionClient,
  userIdToDelete: string,
  preferredUserId?: string,
): Promise<string> {
  if (
    preferredUserId &&
    preferredUserId !== userIdToDelete
  ) {
    const preferred =
      await transaction.user.findUnique({
        where: { id: preferredUserId },
        select: { id: true },
      });

    if (preferred) {
      return preferred.id;
    }
  }

  const fallback =
    await transaction.user.findFirst({
      where: {
        id: { not: userIdToDelete },
        role: {
          in: [
            UserRole.SUPER_ADMIN,
            UserRole.HR_MANAGER,
          ],
        },
        status: UserStatus.ACTIVE,
      },
      orderBy: [
        { role: "asc" },
        { createdAt: "asc" },
      ],
      select: { id: true },
    });

  if (!fallback) {
    throw new Error(
      "Cannot delete this employee because related records still reference their account, and no other admin is available to reassign them.",
    );
  }

  return fallback.id;
}

export async function deleteEmployee(
  id: string,
  deletedByUserId?: string,
) {
  const employee =
    await prisma.employee.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            role: true,
          },
        },
      },
    });

  if (!employee) {
    throw new Error(
      "Employee not found",
    );
  }

  if (
    employee.user?.role ===
    UserRole.SUPER_ADMIN
  ) {
    throw new Error(
      "A Super Admin employee cannot be deleted",
    );
  }

  await prisma.$transaction(
    async (
      transaction:
        Prisma.TransactionClient,
    ) => {
      if (employee.userId) {
        const fallbackUserId =
          await resolveFallbackUserId(
            transaction,
            employee.userId,
            deletedByUserId,
          );

        // Required Restrict FKs on User must be reassigned before delete.
        await transaction.candidate.updateMany({
          where: {
            createdById: employee.userId,
          },
          data: {
            createdById: fallbackUserId,
          },
        });

        await transaction.jobOpening.updateMany({
          where: {
            createdById: employee.userId,
          },
          data: {
            createdById: fallbackUserId,
          },
        });

        await transaction.announcement.updateMany({
          where: {
            createdById: employee.userId,
          },
          data: {
            createdById: fallbackUserId,
          },
        });
      }

      await transaction.employee.delete({
        where: {
          id: employee.id,
        },
      });

      if (employee.userId) {
        await transaction.user.delete({
          where: {
            id: employee.userId,
          },
        });
      }
    },
  );

  return {
    id: employee.id,
  };
}