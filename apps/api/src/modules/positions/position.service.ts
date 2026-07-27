import type { Prisma } from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";

import type {
  CreatePositionInput,
  UpdatePositionInput,
} from "./position.schema.js";

const positionInclude = {
  department: {
    select: {
      id: true,
      name: true,
    },
  },

  _count: {
    select: {
      employees: true,
    },
  },
} satisfies Prisma.PositionInclude;

export async function createPosition(
  input: CreatePositionInput,
) {
  const title = input.title.trim();

  const description =
    input.description?.trim() || null;

  const departmentId =
    input.departmentId?.trim() || null;

  if (departmentId) {
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
        "Department not found",
      );
    }
  }

  const existingPosition =
    await prisma.position.findFirst({
      where: {
        title: {
          equals: title,
          mode: "insensitive",
        },
        departmentId,
      },
      select: {
        id: true,
      },
    });

  if (existingPosition) {
    throw new Error(
      "This position already exists in the selected department",
    );
  }

  return prisma.position.create({
    data: {
      title,
      description,
      departmentId,
    },

    include: positionInclude,
  });
}

export async function getPositions() {
  return prisma.position.findMany({
    orderBy: {
      title: "asc",
    },

    include: positionInclude,
  });
}

export async function getPositionById(
  id: string,
) {
  const position =
    await prisma.position.findUnique({
      where: {
        id,
      },

      include: positionInclude,
    });

  if (!position) {
    throw new Error("Position not found");
  }

  return position;
}

export async function updatePosition(
  id: string,
  input: UpdatePositionInput,
) {
  const currentPosition =
    await prisma.position.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        title: true,
        description: true,
        departmentId: true,
      },
    });

  if (!currentPosition) {
    throw new Error("Position not found");
  }

  const title =
    input.title !== undefined
      ? input.title.trim()
      : currentPosition.title;

  const description =
    input.description !== undefined
      ? input.description.trim() || null
      : currentPosition.description;

  const departmentId =
    input.departmentId !== undefined
      ? input.departmentId?.trim() || null
      : currentPosition.departmentId;

  if (departmentId) {
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
        "Department not found",
      );
    }
  }

  const duplicatePosition =
    await prisma.position.findFirst({
      where: {
        id: {
          not: id,
        },

        title: {
          equals: title,
          mode: "insensitive",
        },

        departmentId,
      },

      select: {
        id: true,
      },
    });

  if (duplicatePosition) {
    throw new Error(
      "This position already exists in the selected department",
    );
  }

  return prisma.position.update({
    where: {
      id,
    },

    data: {
      title,
      description,
      departmentId,
    },

    include: positionInclude,
  });
}

export async function deletePosition(
  id: string,
) {
  const position =
    await prisma.position.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });

  if (!position) {
    throw new Error("Position not found");
  }

  if (position._count.employees > 0) {
    throw new Error(
      "This position cannot be deleted because employees are assigned to it",
    );
  }

  await prisma.position.delete({
    where: {
      id,
    },
  });

  return {
    id: position.id,
  };
}