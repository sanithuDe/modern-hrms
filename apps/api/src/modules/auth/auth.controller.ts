import type { NextFunction, Request, Response } from "express";

import type { AuthenticatedRequest } from "../../middleware/authenticate.js";
import {
  getCurrentUser,
  loginUser,
  requestPasswordReset,
  resetPasswordWithToken,
} from "./auth.service.js";

export async function loginController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await loginUser(request.body);

    response.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function meController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!request.user) {
      response.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const user = await getCurrentUser(request.user.id);

    response.status(200).json({
      success: true,
      message: "Current user retrieved successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export function logoutController(
  _request: Request,
  response: Response,
): void {
  response.status(200).json({
    success: true,
    message: "Logout successful",
  });
}

export async function forgotPasswordController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await requestPasswordReset(request.body);

    response.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPasswordController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await resetPasswordWithToken(request.body);

    response.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
