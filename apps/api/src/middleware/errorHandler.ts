import type { NextFunction, Request, Response } from "express";

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void {
  console.error(error);

  const message =
    error instanceof Error
      ? error.message
      : "An unexpected server error occurred";

  response.status(500).json({
    success: false,
    message,
  });
}