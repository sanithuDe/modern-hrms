import "dotenv/config";

import bcrypt from "bcryptjs";

import {
    PrismaClient,
    UserRole,
    UserStatus,
} from "../src/generated/prisma/client.js";

import { PrismaPg } from "@prisma/adapter-pg";

const connectionString =
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not defined",
  );
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma =
  new PrismaClient({
    adapter,
  });

async function main(): Promise<void> {
  const email =
    (
      process.env
        .SUPER_ADMIN_EMAIL ??
      "admin@example.com"
    )
      .trim()
      .toLowerCase();

  const password =
    process.env
      .SUPER_ADMIN_PASSWORD ??
    "Admin123!";

  const passwordHash =
    await bcrypt.hash(
      password,
      12,
    );

  const user =
    await prisma.user.upsert({
      where: {
        email,
      },

      update: {
        passwordHash,
        role:
          UserRole.SUPER_ADMIN,
        status:
          UserStatus.ACTIVE,
      },

      create: {
        email,
        passwordHash,
        role:
          UserRole.SUPER_ADMIN,
        status:
          UserStatus.ACTIVE,
      },
    });

  const existingEmployee =
    await prisma.employee.findUnique({
      where: {
        userId: user.id,
      },
    });

  if (!existingEmployee) {
    const employeeNumber =
      "ADMIN-001";

    const employeeWithNumber =
      await prisma.employee.findUnique({
        where: {
          employeeNumber,
        },
      });

    if (employeeWithNumber) {
      await prisma.employee.update({
        where: {
          id:
            employeeWithNumber.id,
        },

        data: {
          userId: user.id,
          firstName: "System",
          lastName: "Admin",
          isActive: true,
        },
      });
    } else {
      await prisma.employee.create({
        data: {
          userId: user.id,
          employeeNumber,
          firstName: "System",
          lastName: "Admin",
          isActive: true,
          hireDate: new Date(),
        },
      });
    }
  }

  console.log(
    "Super Admin created successfully",
  );

  console.log({
    email,
    password,
  });
}

main()
  .catch((error: unknown) => {
    console.error(
      "Seed failed:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });