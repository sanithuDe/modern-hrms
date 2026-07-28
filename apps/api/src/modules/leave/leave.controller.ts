import type {
    NextFunction,
    Response,
} from "express";

import type {
    AuthenticatedRequest,
} from "../../middleware/authenticate.js";

import {
    cancelMyLeaveRequest,
    createLeaveBalance,
    createLeaveRequest,
    createLeaveType,
    getLeaveBalances,
    getLeaveRequests,
    getLeaveTypes,
    getMyLeaveBalances,
    getMyLeaveRequests,
    reviewLeaveRequest,
    updateLeaveBalance,
    updateLeaveType,
} from "./leave.service.js";

function getId(
  request: AuthenticatedRequest,
): string {
  const id = request.params["id"];

  if (
    typeof id !== "string" ||
    !id.trim()
  ) {
    throw new Error("ID is required");
  }

  return id;
}

function getUserId(
  request: AuthenticatedRequest,
): string {
  const userId = request.user?.id;

  if (!userId) {
    throw new Error(
      "Authenticated user ID is required",
    );
  }

  return userId;
}

export async function createLeaveTypeController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const leaveType =
      await createLeaveType(request.body);

    response.status(201).json({
      success: true,
      message:
        "Leave type created successfully",
      data: leaveType,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateLeaveTypeController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const leaveType =
      await updateLeaveType(
        getId(request),
        request.body,
      );

    response.status(200).json({
      success: true,
      message:
        "Leave type updated successfully",
      data: leaveType,
    });
  } catch (error) {
    next(error);
  }
}

export async function getLeaveTypesController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const activeOnly =
      request.query["activeOnly"] === "true";

    const leaveTypes =
      await getLeaveTypes(activeOnly);

    response.status(200).json({
      success: true,
      data: leaveTypes,
    });
  } catch (error) {
    next(error);
  }
}

export async function createLeaveBalanceController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const leaveBalance =
      await createLeaveBalance(request.body);

    response.status(201).json({
      success: true,
      message:
        "Leave balance created successfully",
      data: leaveBalance,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateLeaveBalanceController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const leaveBalance =
      await updateLeaveBalance(
        getId(request),
        request.body,
      );

    response.status(200).json({
      success: true,
      message:
        "Leave balance updated successfully",
      data: leaveBalance,
    });
  } catch (error) {
    next(error);
  }
}

export async function getLeaveBalancesController(
  _request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const leaveBalances =
      await getLeaveBalances();

    response.status(200).json({
      success: true,
      data: leaveBalances,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyLeaveBalancesController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const leaveBalances =
      await getMyLeaveBalances(
        getUserId(request),
      );

    response.status(200).json({
      success: true,
      data: leaveBalances,
    });
  } catch (error) {
    next(error);
  }
}

export async function createLeaveRequestController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const leaveRequest =
      await createLeaveRequest(
        getUserId(request),
        request.body,
      );

    response.status(201).json({
      success: true,
      message:
        "Leave request submitted successfully",
      data: leaveRequest,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyLeaveRequestsController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const leaveRequests =
      await getMyLeaveRequests(
        getUserId(request),
      );

    response.status(200).json({
      success: true,
      data: leaveRequests,
    });
  } catch (error) {
    next(error);
  }
}

export async function getLeaveRequestsController(
  _request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const leaveRequests =
      await getLeaveRequests();

    response.status(200).json({
      success: true,
      data: leaveRequests,
    });
  } catch (error) {
    next(error);
  }
}

export async function reviewLeaveRequestController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const leaveRequest =
      await reviewLeaveRequest(
        getId(request),
        getUserId(request),
        request.body,
      );

    response.status(200).json({
      success: true,
      message:
        request.body.decision ===
        "APPROVED"
          ? "Leave request approved successfully"
          : "Leave request rejected successfully",
      data: leaveRequest,
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelMyLeaveRequestController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const leaveRequest =
      await cancelMyLeaveRequest(
        getId(request),
        getUserId(request),
      );

    response.status(200).json({
      success: true,
      message:
        "Leave request cancelled successfully",
      data: leaveRequest,
    });
  } catch (error) {
    next(error);
  }
}