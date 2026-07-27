import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "./authenticate.js";

export function authorizeRoles(...allowedRoles: string[]) {
  return (
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): void => {
    if (!request.user) {
      response.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!allowedRoles.includes(request.user.role)) {
      response.status(403).json({
        success: false,
        message: "You do not have permission to access this resource",
      });
      return;
    }

    next();
  };
}