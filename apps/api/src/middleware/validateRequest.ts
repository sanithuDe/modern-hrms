import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

export function validateRequest(schema: ZodTypeAny) {
  return (
    request: Request,
    response: Response,
    next: NextFunction,
  ): void => {
    const result = schema.safeParse({
      body: request.body,
      params: request.params,
      query: request.query,
    });

    if (!result.success) {
      response.status(422).json({
        success: false,
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });

      return;
    }

    const validatedData = result.data as {
      body?: unknown;
      params?: unknown;
      query?: unknown;
    };

    if (validatedData.body !== undefined) {
      request.body = validatedData.body;
    }

    next();
  };
}