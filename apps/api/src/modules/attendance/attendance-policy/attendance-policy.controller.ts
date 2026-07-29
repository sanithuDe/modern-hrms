import type {
  NextFunction,
  Response,
} from "express";

import type {
  AuthenticatedRequest,
} from "../../../middleware/authenticate.js";

import {
  updateAttendancePolicySchema,
} from "./attendance-policy.schema.js";

import {
  getAttendancePolicy,
  updateAttendancePolicy,
} from "./attendance-policy.service.js";

export async function getAttendancePolicyController(
  _request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const policy =
      await getAttendancePolicy();

    response.status(200).json({
      success: true,
      data: policy,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAttendancePolicyController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input =
      updateAttendancePolicySchema.parse(
        request.body,
      );

    const policy =
      await updateAttendancePolicy(
        input,
      );

    response.status(200).json({
      success: true,
      message:
        "Attendance policy updated successfully",
      data: policy,
    });
  } catch (error) {
    next(error);
  }
}