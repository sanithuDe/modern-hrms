import type {
  NextFunction,
  Response,
} from "express";

import type {
  AuthenticatedRequest,
} from "../../middleware/authenticate.js";

import {
  assignShiftSchema,
  createShiftSchema,
  shiftIdParamsSchema,
  updateShiftSchema,
} from "./shift.schema.js";

import {
  assignShift,
  createShift,
  getMyAssignedShift,
  getShiftAssignments,
  getShifts,
  updateShift,
} from "./shift.service.js";

export async function createShiftController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input =
      createShiftSchema.parse(
        request.body,
      );

    const shift =
      await createShift(input);

    response.status(201).json({
      success: true,
      message:
        "Shift created successfully",
      data: shift,
    });
  } catch (error) {
    next(error);
  }
}

export async function getShiftsController(
  _request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const shifts =
      await getShifts();

    response.status(200).json({
      success: true,
      message:
        "Shifts retrieved successfully",
      data: shifts,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateShiftController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params =
      shiftIdParamsSchema.parse(
        request.params,
      );

    const input =
      updateShiftSchema.parse(
        request.body,
      );

    const shift =
      await updateShift(
        params.id,
        input,
      );

    response.status(200).json({
      success: true,
      message:
        "Shift updated successfully",
      data: shift,
    });
  } catch (error) {
    next(error);
  }
}

export async function assignShiftController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId =
      request.user?.id;

    if (!userId) {
      response.status(401).json({
        success: false,
        message: "Unauthorized",
      });

      return;
    }

    const input =
      assignShiftSchema.parse(
        request.body,
      );

    const assignment =
      await assignShift(
        input,
        userId,
      );

    response.status(201).json({
      success: true,
      message:
        "Shift assigned successfully",
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
}

export async function getShiftAssignmentsController(
  _request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const assignments =
      await getShiftAssignments();

    response.status(200).json({
      success: true,
      message:
        "Shift assignments retrieved successfully",
      data: assignments,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyAssignedShiftController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId =
      request.user?.id;

    if (!userId) {
      response.status(401).json({
        success: false,
        message: "Unauthorized",
      });

      return;
    }

    const assignment =
      await getMyAssignedShift(
        userId,
      );

    response.status(200).json({
      success: true,

      message: assignment
        ? "Assigned shift retrieved successfully"
        : "No active shift assignment found",

      data: assignment,
    });
  } catch (error) {
    next(error);
  }
}