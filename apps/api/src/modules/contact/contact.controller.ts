import type { NextFunction, Request, Response } from "express";

import { submitContactMessage } from "./contact.service.js";

export async function submitContactController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await submitContactMessage(request.body);

    response.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
