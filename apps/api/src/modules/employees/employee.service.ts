import {
    Prisma,
    UserRole,
    UserStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

import { prisma } from "../../lib/prisma.js";

export interface CreateEmployeeInput {
  email: string;
  password: string;
  role: UserRole;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  phone?: string;
  hireDate: string;
  departmentId?: string | null;
  positionId?: string | null;
}

export interface UpdateEmployeeInput {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  hireDate?: string;
  departmentId?: string | null;
  positionId?: string | null;
  role?: UserRole;
}

export interface UpdateEmployeeStatusInput {
  status: UserStatus;
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

async function validateDepartment(
  departmentId: string | null | undefined,
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
  positionId: string | null | undefined,
  departmentId: string | null | undefined,
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

  await validateDepartment(
    input.departmentId,
  );

  await validatePosition(
    input.positionId,
    input.departmentId,
  );

  const passwordHash =
    await bcrypt.hash(input.password, 12);

  return prisma.$transaction(
    async (transaction) => {
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
          firstName:
            input.firstName.trim(),
          lastName:
            input.lastName.trim(),
          phone:
            input.phone?.trim() || null,
          hireDate:
            new Date(input.hireDate),
          departmentId:
            input.departmentId || null,
          positionId:
            input.positionId || null,
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
    throw new Error("Employee not found");
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
      },
    });

  if (!existingEmployee) {
    throw new Error("Employee not found");
  }

  const departmentId =
    input.departmentId !== undefined
      ? input.departmentId
      : existingEmployee.departmentId;

  const positionId =
    input.positionId !== undefined
      ? input.positionId
      : existingEmployee.positionId;

  await validateDepartment(departmentId);

  await validatePosition(
    positionId,
    departmentId,
  );

  return prisma.$transaction(
    async (transaction) => {
      if (input.role !== undefined) {
        await transaction.user.update({
          where: {
            id: existingEmployee.userId,
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

        data: {
          ...(input.firstName !==
            undefined && {
            firstName:
              input.firstName.trim(),
          }),

          ...(input.lastName !==
            undefined && {
            lastName:
              input.lastName.trim(),
          }),

          ...(input.phone !== undefined && {
            phone:
              input.phone?.trim() || null,
          }),

          ...(input.hireDate !==
            undefined && {
            hireDate:
              new Date(input.hireDate),
          }),

          ...(input.departmentId !==
            undefined && {
            departmentId:
              input.departmentId,
          }),

          ...(input.positionId !==
            undefined && {
            positionId:
              input.positionId,
          }),
        },

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
      },
    });

  if (!employee) {
    throw new Error("Employee not found");
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

export async function deleteEmployee(
  id: string,
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
    throw new Error("Employee not found");
  }

  if (
    employee.user.role ===
    UserRole.SUPER_ADMIN
  ) {
    throw new Error(
      "A Super Admin employee cannot be deleted",
    );
  }

  await prisma.$transaction(
    async (transaction) => {
      await transaction.employee.delete({
        where: {
          id: employee.id,
        },
      });

      await transaction.user.delete({
        where: {
          id: employee.userId,
        },
      });
    },
  );

  return {
    id: employee.id,
  };
}