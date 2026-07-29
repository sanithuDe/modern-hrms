import type {
    NextFunction,
    Request,
    Response,
} from "express";

import type {
    AuthenticatedRequest,
} from "../../middleware/authenticate.js";

import {
    approvePayroll,
    createSalaryProfile,
    generatePayroll,
    getMyPayrolls,
    getPayrolls,
    getSalaryProfiles,
    markPayrollPaid,
    updateSalaryProfile,
} from "./payroll.service.js";

function getId(
  request: Request,
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

function getAuthenticatedUserId(
  request: Request,
): string {
  const authenticatedRequest =
    request as AuthenticatedRequest;

  const userId =
    authenticatedRequest.user?.id;

  if (!userId) {
    throw new Error(
      "Authenticated user not found",
    );
  }

  return userId;
}

export async function createSalaryProfileController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const profile =
      await createSalaryProfile(
        request.body,
      );

    response.status(201).json({
      success: true,
      message:
        "Salary profile created successfully",
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSalaryProfileController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const employeeId =
      request.params["employeeId"];

    if (
      typeof employeeId !== "string" ||
      !employeeId.trim()
    ) {
      throw new Error(
        "Employee ID is required",
      );
    }

    const profile =
      await updateSalaryProfile(
        employeeId,
        request.body,
      );

    response.status(200).json({
      success: true,
      message:
        "Salary profile updated successfully",
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSalaryProfilesController(
  _request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const profiles =
      await getSalaryProfiles();

    response.status(200).json({
      success: true,
      data: profiles,
    });
  } catch (error) {
    next(error);
  }
}

export async function generatePayrollController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payroll =
      await generatePayroll(
        request.body,
      );

    response.status(201).json({
      success: true,
      message:
        "Payroll generated successfully",
      data: payroll,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPayrollsController(
  _request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payrolls =
      await getPayrolls();

    response.status(200).json({
      success: true,
      data: payrolls,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyPayrollsController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId =
      getAuthenticatedUserId(request);

    const payrolls =
      await getMyPayrolls(userId);

    response.status(200).json({
      success: true,
      data: payrolls,
    });
  } catch (error) {
    next(error);
  }
}

export async function approvePayrollController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payroll =
      await approvePayroll(
        getId(request),
      );

    response.status(200).json({
      success: true,
      message:
        "Payroll approved successfully",
      data: payroll,
    });
  } catch (error) {
    next(error);
  }
}

export async function markPayrollPaidController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payroll =
      await markPayrollPaid(
        getId(request),
      );

    response.status(200).json({
      success: true,
      message:
        "Payroll marked as paid",
      data: payroll,
    });
  } catch (error) {
    next(error);
  }
}