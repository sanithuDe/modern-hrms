import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

interface JwtPayload {
  userId: string;
  role: string;
}

export function authenticate(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): void {
  try {
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader?.startsWith("Bearer ")) {
      response.status(401).json({
        success: false,
        message: "Authentication token is missing",
      });
      return;
    }

    const token = authorizationHeader.split(" ")[1];

    const secret = process.env.JWT_ACCESS_SECRET;

    if (!secret) {
      throw new Error("JWT_ACCESS_SECRET is not configured");
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;

    request.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch {
    response.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}