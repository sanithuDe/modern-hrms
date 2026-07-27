import type { Prisma } from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";

import type {
  CreateDepartmentInput,
  UpdateDepartmentInput,
} from "./department.schema.js";

const departmentInclude = {
  _count: {
    select: {
      employees: true,
      positions: true,
    },
  },
} satisfies Prisma.DepartmentInclude;

export async function createDepartment(
  input: CreateDepartmentInput,
) {
  const name = input.name.trim();

  const existingDepartment =
    await prisma.department.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
      },
    });

  if (existingDepartment) {
    throw new Error(
      "A department with this name already exists",
    );
  }

  return prisma.department.create({
    data: {
      name,
      description:
        input.description?.trim() || null,
    },
    include: departmentInclude,
  });
}

export async function getDepartments() {
  return prisma.department.findMany({
    include: departmentInclude,
    orderBy: {
      name: "asc",
    },
  });
}

export async function getDepartmentById(
  id: string,
) {
  const department =
    await prisma.department.findUnique({
      where: {
        id,
      },
      include: departmentInclude,
    });

  if (!department) {
    throw new Error("Department not found");
  }

  return department;
}

export async function updateDepartment(
  id: string,
  input: UpdateDepartmentInput,
) {
  const existingDepartment =
    await prisma.department.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

  if (!existingDepartment) {
    throw new Error("Department not found");
  }

  if (input.name !== undefined) {
    const normalizedName =
      input.name.trim();

    const duplicateDepartment =
      await prisma.department.findFirst({
        where: {
          id: {
            not: id,
          },
          name: {
            equals: normalizedName,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
        },
      });

    if (duplicateDepartment) {
      throw new Error(
        "A department with this name already exists",
      );
    }
  }

  return prisma.department.update({
    where: {
      id,
    },
    data: {
      ...(input.name !== undefined
        ? {
            name: input.name.trim(),
          }
        : {}),

      ...(input.description !== undefined
        ? {
            description:
              input.description?.trim() ||
              null,
          }
        : {}),
    },
    include: departmentInclude,
  });
}

export async function deleteDepartment(
  id: string,
) {
  const department =
    await prisma.department.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        _count: {
          select: {
            employees: true,
            positions: true,
          },
        },
      },
    });

  if (!department) {
    throw new Error("Department not found");
  }

  if (department._count.employees > 0) {
    throw new Error(
      "This department cannot be deleted because employees are assigned to it",
    );
  }

  if (department._count.positions > 0) {
    throw new Error(
      "This department cannot be deleted because positions are assigned to it",
    );
  }

  await prisma.department.delete({
    where: {
      id,
    },
  });

  return {
    id: department.id,
  };
}