import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import {
    prisma,
} from "../../config/prisma.js";

import type {
    UserRole,
} from "../../generated/prisma/client.js";

import type {
    LoginInput,
} from "./auth.schema.js";

interface AccessTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export async function loginUser(
  input: LoginInput,
) {
  const normalizedEmail =
    input.email
      .trim()
      .toLowerCase();

  const user =
    await prisma.user.findUnique({
      where: {
        email:
          normalizedEmail,
      },

      include: {
        employee: {
          include: {
            department: true,
            position: true,
          },
        },
      },
    });

  if (!user) {
    throw new Error(
      "Invalid email or password",
    );
  }

  if (
    user.status !== "ACTIVE"
  ) {
    throw new Error(
      "Your account is not active",
    );
  }

  if (!user.passwordHash) {
    throw new Error(
      "This user does not have a password configured",
    );
  }

  const passwordMatches =
    await bcrypt.compare(
      input.password,
      user.passwordHash,
    );

  if (!passwordMatches) {
    throw new Error(
      "Invalid email or password",
    );
  }

  const jwtSecret =
    process.env.JWT_ACCESS_SECRET;

  if (!jwtSecret) {
    throw new Error(
      "JWT_ACCESS_SECRET is not configured",
    );
  }

  const tokenPayload: AccessTokenPayload =
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

  const accessToken =
    jwt.sign(
      tokenPayload,
      jwtSecret,
      {
        expiresIn: "15m",
      },
    );

  return {
    accessToken,

    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      employee: user.employee,
    },
  };
}

export async function getCurrentUser(
  userId: string,
) {
  const user =
    await prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,

        employee: {
          include: {
            department: true,
            position: true,
          },
        },
      },
    });

  if (!user) {
    throw new Error(
      "User not found",
    );
  }

  if (
    user.status !== "ACTIVE"
  ) {
    throw new Error(
      "Your account is not active",
    );
  }

  return user;
}