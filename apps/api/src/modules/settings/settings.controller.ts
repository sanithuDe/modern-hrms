import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  getAttendanceSettings,
  resetAttendanceSettings,
  updateAttendanceSettings,
} from "./settings.service.js";

export async function getAttendanceSettingsController(
  _request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const settings =
      await getAttendanceSettings();

    response.status(200).json({
      success: true,

      message:
        "Attendance settings retrieved successfully",

      data:
        settings,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAttendanceSettingsController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const settings =
      await updateAttendanceSettings(
        request.body,
      );

    response.status(200).json({
      success: true,

      message:
        "Attendance settings updated successfully",

      data:
        settings,
    });
  } catch (error) {
    next(error);
  }
}

export async function resetAttendanceSettingsController(
  _request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const settings =
      await resetAttendanceSettings();

    response.status(200).json({
      success: true,

      message:
        "Attendance settings reset successfully",

      data:
        settings,
    });
  } catch (error) {
    next(error);
  }
}