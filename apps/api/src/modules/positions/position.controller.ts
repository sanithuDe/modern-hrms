import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  createPosition,
  deletePosition,
  getPositionById,
  getPositions,
  updatePosition,
} from "./position.service.js";

function getPositionId(
  request: Request,
): string {
  const id = request.params["id"];

  if (
    typeof id !== "string" ||
    id.trim().length === 0
  ) {
    throw new Error(
      "Position ID is required",
    );
  }

  return id;
}

export async function createPositionController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const position =
      await createPosition(request.body);

    response.status(201).json({
      success: true,
      message:
        "Position created successfully",
      data: position,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPositionsController(
  _request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const positions =
      await getPositions();

    response.status(200).json({
      success: true,
      message:
        "Positions retrieved successfully",
      data: positions,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPositionController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = getPositionId(request);

    const position =
      await getPositionById(id);

    response.status(200).json({
      success: true,
      message:
        "Position retrieved successfully",
      data: position,
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePositionController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = getPositionId(request);

    const position =
      await updatePosition(
        id,
        request.body,
      );

    response.status(200).json({
      success: true,
      message:
        "Position updated successfully",
      data: position,
    });
  } catch (error) {
    next(error);
  }
}

export async function deletePositionController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = getPositionId(request);

    const result =
      await deletePosition(id);

    response.status(200).json({
      success: true,
      message:
        "Position deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}