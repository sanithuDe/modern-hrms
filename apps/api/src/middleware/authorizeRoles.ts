import type {
  NextFunction,
  Response,
} from "express";

import type {
  UserRole,
} from "../generated/prisma/client.js";

import type {
  AuthenticatedRequest,
} from "./authenticate.js";

export function authorizeRoles(
  ...allowedRoles: UserRole[]
) {
  return (
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): void => {
    const userRole =
      request.user?.role;

    if (!userRole) {
      response.status(401).json({
        success: false,
        message:
          "Authentication required",
      });

      return;
    }

    if (
      !allowedRoles.includes(
        userRole,
      )
    ) {
      response.status(403).json({
        success: false,
        message:
          "You do not have permission to access this resource",
      });

      return;
    }

    next();
  };
}