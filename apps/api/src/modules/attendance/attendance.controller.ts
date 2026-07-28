import type {
  NextFunction,
  Response,
} from "express";

import type {
  AuthenticatedRequest,
} from "../../middleware/authenticate.js";

import {
  attendanceQuerySchema,
  checkInSchema,
  checkOutSchema,
  manualAttendanceSchema,
  updateAttendanceSchema,
} from "./attendance.schema.js";

import {
  checkInEmployee,
  checkOutEmployee,
  createManualAttendance,
  deleteAttendance,
  getAllAttendance,
  getMyAttendance,
  getMyTodayAttendance,
  updateAttendance,
} from "./attendance.service.js";

function getAuthenticatedUserId(
  request: AuthenticatedRequest,
): string {
  const userId = request.user?.id;

  if (!userId) {
    throw new Error("Unauthenticated");
  }

  return userId;
}

function getAttendanceId(
  request: AuthenticatedRequest,
): string {
  const attendanceId = request.params.id;

  if (
    typeof attendanceId !== "string" ||
    attendanceId.trim().length === 0
  ) {
    throw new Error("Attendance ID is required");
  }

  return attendanceId;
}

export async function checkInController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = getAuthenticatedUserId(request);

    const input = checkInSchema.parse(
      request.body,
    );

    const attendance = await checkInEmployee(
      userId,
      input,
    );

    response.status(201).json({
      success: true,
      message: "Checked in successfully",
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
}

export async function checkOutController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = getAuthenticatedUserId(request);

    const input = checkOutSchema.parse(
      request.body,
    );

    const attendance = await checkOutEmployee(
      userId,
      input,
    );

    response.status(200).json({
      success: true,
      message: "Checked out successfully",
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyTodayAttendanceController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = getAuthenticatedUserId(request);

    const attendance =
      await getMyTodayAttendance(userId);

    response.status(200).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyAttendanceController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = getAuthenticatedUserId(request);

    const query = attendanceQuerySchema.parse(
      request.query,
    );

    const result = await getMyAttendance(
      userId,
      query,
    );

    response.status(200).json({
      success: true,
      data: result.records,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAllAttendanceController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = attendanceQuerySchema.parse(
      request.query,
    );

    const result = await getAllAttendance(query);

    response.status(200).json({
      success: true,
      data: result.records,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function createManualAttendanceController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = getAuthenticatedUserId(request);

    const input = manualAttendanceSchema.parse(
      request.body,
    );

    const attendance =
      await createManualAttendance(
        input,
        userId,
      );

    response.status(201).json({
      success: true,
      message: "Attendance created successfully",
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAttendanceController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = getAuthenticatedUserId(request);

    const attendanceId =
      getAttendanceId(request);

    const input = updateAttendanceSchema.parse(
      request.body,
    );

    const attendance = await updateAttendance(
      attendanceId,
      input,
      userId,
    );

    response.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAttendanceController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const attendanceId =
      getAttendanceId(request);

    await deleteAttendance(attendanceId);

    response.status(200).json({
      success: true,
      message: "Attendance deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}