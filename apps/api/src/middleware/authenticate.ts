import type {
    NextFunction,
    Request,
    Response,
} from "express";

import jwt from "jsonwebtoken";

import type {
    UserRole,
} from "../generated/prisma/client.js";

export interface AuthenticatedRequest
  extends Request {
  user?: {
    id: string;
    email?: string;
    role: UserRole;
  };
}

interface JwtPayload {
  userId?: string;
  id?: string;
  sub?: string;
  email?: string;
  role?: UserRole;
  iat?: number;
  exp?: number;
}

export function authenticate(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): void {
  try {
    const authorizationHeader =
      request.headers.authorization;

    if (!authorizationHeader) {
      response.status(401).json({
        success: false,
        message:
          "Authentication token is missing",
      });

      return;
    }

    const [scheme, token] =
      authorizationHeader.split(" ");

    if (
      scheme !== "Bearer" ||
      !token
    ) {
      response.status(401).json({
        success: false,
        message:
          "Invalid authorization header",
      });

      return;
    }

    const secret =
      process.env.JWT_ACCESS_SECRET;

    if (!secret) {
      throw new Error(
        "JWT_ACCESS_SECRET is not configured",
      );
    }

    const decoded = jwt.verify(
      token,
      secret,
    ) as JwtPayload;

    const userId =
      decoded.userId ??
      decoded.id ??
      decoded.sub;

    if (
      !userId ||
      !decoded.role
    ) {
      response.status(401).json({
        success: false,
        message:
          "Invalid token payload",
      });

      return;
    }

    request.user = {
      id: userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch {
    response.status(401).json({
      success: false,
      message:
        "Invalid or expired token",
    });
  }
}